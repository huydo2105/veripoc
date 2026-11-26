import test from "node:test";
import assert from "node:assert/strict";
import { privateKeyToAccount } from "viem/accounts";
import { createApiServer } from "../../apps/api/server.mjs";
import { DEMO_PROGRAM } from "../../apps/api/program.mjs";
import { createAgentGatewayClient } from "./client.mjs";
import { createMcpHandler, MCP_PROTOCOL_VERSION } from "./mcp-server.mjs";

const token = "gateway-operator-token-with-thirty-two-chars-000001";
const teamToken = "gateway-team-token-with-at-least-thirty-two-chars-02";
const researcherToken = "gateway-researcher-token-with-thirty-two-chars-0003";
const DOMAIN = "auditor.local";

const invitedKey = "0x1111111111111111111111111111111111111111111111111111111111111111";
const otherInvitedKey = "0x2222222222222222222222222222222222222222222222222222222222222222";
const forgedKey = "0x3333333333333333333333333333333333333333333333333333333333333333";

const INVITED_BADGE = "JyP9UhUtd9AeJywDRsg5q";
const OTHER_BADGE = "KxQ8ViVue8BfKzxESth6r";
const UNINVITED_BADGE = "MzS6XkXwg6DhMbzGUvj8t";

function registryFixture(badge, privateKey, owner = "43fN3v9K7sP6aR2uT1wX8yZ5cB4dE2fG1hJ3kL5mN7pQ9rS2tU") {
  const pubHex = privateKeyToAccount(privateKey).publicKey.slice(2);
  const cardHash = "a".repeat(64);
  return {
    check: {
      badge_valid: true,
      network: "testnet",
      token_address: badge,
      card_sha256: cardHash,
      checks: { hash_matches_on_chain: true },
      expected: { chain: "ccd:4221332d34e1694168c2a0c0b3fd0f27", contracts: { cis8004: "12802,0", cis8: "12801,0" } },
      on_chain: { status: "Active", agent_uri: "https://auditor.example/.well-known/agent-card.json", owner_account: owner, metadata_hash_hex: cardHash },
    },
    agent: {
      network: "testnet",
      token_address: badge,
      status: "Active",
      agent_uri: "https://auditor.example/.well-known/agent-card.json",
      owner_account: owner,
      metadata_hash_hex: cardHash,
      external_reference: {
        kind: "Cis8",
        contract_address: { index: 12801, subindex: 0 },
        key: { key_type: "secp256k1-uncompressed", namespace: "eip155:8453", public_key_hex: pubHex },
      },
    },
    binding: { status: "Active", owner },
  };
}

const registryMap = new Map([
  [INVITED_BADGE, registryFixture(INVITED_BADGE, invitedKey)],
  [OTHER_BADGE, registryFixture(OTHER_BADGE, otherInvitedKey)],
  [UNINVITED_BADGE, registryFixture(UNINVITED_BADGE, forgedKey)],
]);

const validReport = {
  title: "First-depositor donation inflates share price and zeroes victim shares",
  location: "contracts/evm/FixtureVault.sol#previewDeposit",
  rootCause: "Share math divides by raw token balance without virtual shares.",
  impact: "Victim deposits 200 tokens and receives 0 shares while attacker captures funds.",
  invariant: "A non-zero honest deposit must always mint non-zero shares.",
  reproduction: "Run VulnerableVault fixture via test/TrustedVaultWorker.t.sol.",
  tools: "Foundry + custom local AI agent",
};

async function startTestServer(options = {}) {
  const server = createApiServer({
    token,
    teamToken,
    researcherToken,
    agentDomain: DOMAIN,
    invitedAgentBadges: [INVITED_BADGE, OTHER_BADGE],
    lookupAgent: async badge => {
      const entry = registryMap.get(badge);
      if (!entry) throw new Error("badge not found");
      return entry;
    },
    execute: async (_kind, body) => ({
      status: body.fixture === "vulnerable" ? "reproduced" : "not_reproduced",
      receipt: {
        receiptHash: body.fixture === "vulnerable" ? "b".repeat(64) : "c".repeat(64),
        input: { sourceSha256: DEMO_PROGRAM.workerInputSha256 },
      },
    }),
    ...options,
  });
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address();
  return {
    apiOrigin: `http://127.0.0.1:${port}`,
    close: () => new Promise((resolve, reject) => server.close(err => (err ? reject(err) : resolve()))),
  };
}

test("external MCP client reads invited scope, submits structured report, runs Foundry job, and reads private evidence", async () => {
  const { apiOrigin, close } = await startTestServer();
  try {
    const client = createAgentGatewayClient({ apiOrigin, badge: INVITED_BADGE, domain: DOMAIN, privateKey: invitedKey });
    const mcp = createMcpHandler(client);

    const init = await mcp({ jsonrpc: "2.0", id: 1, method: "initialize" });
    assert.equal(init.result.protocolVersion, MCP_PROTOCOL_VERSION);

    const listed = await mcp({ jsonrpc: "2.0", id: 2, method: "tools/list" });
    assert.deepEqual(
      listed.result.tools.map(t => t.name),
      ["get_program_scope", "submit_finding", "verify_poc", "get_job_status", "get_verification_evidence"],
    );

    const scopeCall = await mcp({ jsonrpc: "2.0", id: 3, method: "tools/call", params: { name: "get_program_scope", arguments: { programId: "demo-vault" } } });
    assert.equal(scopeCall.result.isError, false);
    const scope = JSON.parse(scopeCall.result.content[0].text);
    assert.equal(scope.program.id, "demo-vault");
    assert.equal(scope.actor.role, "researcher");
    assert.equal(scope.actor.badge, INVITED_BADGE);

    const submitCall = await mcp({
      jsonrpc: "2.0",
      id: 4,
      method: "tools/call",
      params: {
        name: "submit_finding",
        arguments: {
          programId: "demo-vault",
          claim: "donation-share-inflation",
          targetSha256: scope.program.targetSha256,
          report: validReport,
          idempotencyKey: "mcp-submit-key-001",
        },
      },
    });
    assert.equal(submitCall.result.isError, false);
    const submission = JSON.parse(submitCall.result.content[0].text);
    assert.equal(submission.report.title, validReport.title);
    assert.equal(submission.authorId, `agent:${INVITED_BADGE}`);

    const verifyCall = await mcp({
      jsonrpc: "2.0",
      id: 5,
      method: "tools/call",
      params: {
        name: "verify_poc",
        arguments: {
          programId: "demo-vault",
          submissionId: submission.id,
          fixture: "vulnerable",
          idempotencyKey: "mcp-verify-key-001",
        },
      },
    });
    assert.equal(verifyCall.result.isError, false);
    const job = JSON.parse(verifyCall.result.content[0].text);

    // Wait briefly for the mock async executor to settle.
    let status;
    for (let i = 0; i < 20; i++) {
      const statusCall = await mcp({
        jsonrpc: "2.0",
        id: 6 + i,
        method: "tools/call",
        params: { name: "get_job_status", arguments: { programId: "demo-vault", jobId: job.id } },
      });
      status = JSON.parse(statusCall.result.content[0].text);
      if (status.state === "finished") break;
      await new Promise(resolve => setTimeout(resolve, 15));
    }
    assert.equal(status.state, "finished");

    const evidenceCall = await mcp({
      jsonrpc: "2.0",
      id: 30,
      method: "tools/call",
      params: { name: "get_verification_evidence", arguments: { programId: "demo-vault", jobId: job.id } },
    });
    assert.equal(evidenceCall.result.isError, false);
    const evidence = JSON.parse(evidenceCall.result.content[0].text);
    assert.equal(evidence.verdict, "reproduced");
    assert.equal(evidence.claim, "donation-share-inflation");
    assert.equal(evidence.targetSha256, DEMO_PROGRAM.targetSha256);
    assert.equal(evidence.evidence.receipt.receiptHash, "b".repeat(64));

    // Another invited agent cannot read this agent's private evidence.
    const otherClient = createAgentGatewayClient({ apiOrigin, badge: OTHER_BADGE, domain: DOMAIN, privateKey: otherInvitedKey });
    const crossRead = await otherClient.getVerificationEvidence({ programId: "demo-vault", jobId: job.id });
    assert.equal(crossRead.status, 404);
  } finally {
    await close();
  }
});

test("missing invitation, forged key, wrong domain/program/target, malformed report, and conflicting idempotency fail closed", async () => {
  const { apiOrigin, close } = await startTestServer();
  try {
    // 1. Uninvited badge fails closed (401).
    const uninvited = createAgentGatewayClient({ apiOrigin, badge: UNINVITED_BADGE, domain: DOMAIN, privateKey: forgedKey });
    assert.equal((await uninvited.getProgramScope("demo-vault")).status, 401);

    // 2. Forged key for invited badge fails closed (401).
    const forged = createAgentGatewayClient({ apiOrigin, badge: INVITED_BADGE, domain: DOMAIN, privateKey: forgedKey });
    assert.equal((await forged.getProgramScope("demo-vault")).status, 401);

    // 3. Wrong signing domain fails closed (401).
    const wrongDomain = createAgentGatewayClient({ apiOrigin, badge: INVITED_BADGE, domain: "evil.example", privateKey: invitedKey });
    assert.equal((await wrongDomain.getProgramScope("demo-vault")).status, 401);

    // 4. Valid agent: wrong program, wrong target, malformed report, conflicting idempotency, unapproved fixture all fail closed.
    const client = createAgentGatewayClient({ apiOrigin, badge: INVITED_BADGE, domain: DOMAIN, privateKey: invitedKey });
    await assert.rejects(() => client.getProgramScope("aave"), /programId/);

    const badTarget = await client.submitFinding({
      programId: "demo-vault",
      claim: "donation-share-inflation",
      targetSha256: "0".repeat(64),
      report: validReport,
      idempotencyKey: "neg-bad-target-1",
    });
    assert.equal(badTarget.status, 400);

    const malformedReport = await client.submitFinding({
      programId: "demo-vault",
      claim: "donation-share-inflation",
      targetSha256: DEMO_PROGRAM.targetSha256,
      report: { title: "Missing required fields", extraField: "nope" },
      idempotencyKey: "neg-malformed-1",
    });
    assert.equal(malformedReport.status, 400);

    const validSub = await client.submitFinding({
      programId: "demo-vault",
      claim: "donation-share-inflation",
      targetSha256: DEMO_PROGRAM.targetSha256,
      report: validReport,
      idempotencyKey: "neg-conflict-key",
    });
    assert.equal(validSub.status, 201);

    const conflictSub = await client.submitFinding({
      programId: "demo-vault",
      claim: "donation-share-inflation",
      targetSha256: DEMO_PROGRAM.targetSha256,
      report: { ...validReport, title: "Different title reusing same key" },
      idempotencyKey: "neg-conflict-key",
    });
    assert.equal(conflictSub.status, 409);

    const badFixture = await client.verifyPoc({
      programId: "demo-vault",
      submissionId: validSub.data.id,
      fixture: "arbitrary-solidity-poc",
      idempotencyKey: "neg-bad-fixture-1",
    });
    assert.equal(badFixture.status, 400);
  } finally {
    await close();
  }
});
