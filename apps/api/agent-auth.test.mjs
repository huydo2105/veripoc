import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { privateKeyToAccount } from "viem/accounts";
import { agentMessage } from "./agent-auth.mjs";
import { createApiServer } from "./server.mjs";
import { DEMO_PROGRAM } from "./program.mjs";

const token = "operator-token-with-at-least-thirty-two-characters";
const teamToken = "team-token-with-at-least-thirty-two-characters";
const researcherToken = "researcher-token-with-at-least-thirty-two-characters";
const domain = "auditor.local";
const badge = "JyP9UhUtd9AeJywDRsg5q";
const owner = "test-concordium-owner";
const chain = "ccd:4221332d34e1694168c2a0c0b3fd0f27";
const account = privateKeyToAccount(`0x${"11".repeat(32)}`);
const pubkey = account.publicKey.slice(2);
const root = "/v1/programs/demo-vault";

function registryState() {
  return {
    check: { badge_valid: true, network: "testnet", token_address: badge,
      card_sha256: "a".repeat(64), on_chain: { owner_account: owner, status: "Active",
        agent_uri: "https://example.test/agent-card.json", metadata_hash_hex: "a".repeat(64) },
      checks: { hash_matches_on_chain: true }, expected: { chain, contracts: { cis8004: "12802,0", cis8: "12801,0" } } },
    agent: { network: "testnet", token_address: badge, owner_account: owner, status: "Active",
      metadata_hash_hex: "a".repeat(64), agent_uri: "https://example.test/agent-card.json",
      external_reference: { kind: "Cis8",
        contract_address: { index: 12801, subindex: 0 },
        key: { namespace: "eip155:8453", key_type: "secp256k1-uncompressed", public_key_hex: pubkey } } },
    binding: { status: "Active", owner },
  };
}

async function withServer(fn, { state = registryState(), invitedAgentBadges = [badge], now = Date.now,
  lookupAgent = async () => state } = {}) {
  const server = createApiServer({ token, teamToken, researcherToken, invitedAgentBadges,
    agentDomain: domain, lookupAgent, now,
    execute: async (_kind, body) => ({ status: body.fixture === "vulnerable" ? "reproduced" : "not_reproduced",
      receipt: { private: true, input: { sourceSha256: DEMO_PROGRAM.workerInputSha256 } } }) });
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  try { await fn(`http://127.0.0.1:${server.address().port}`); }
  finally { await new Promise(resolve => server.close(resolve)); }
}

async function signed(base, path, { method = "GET", payload, signer = account,
  nonce = randomUUID(), expires = Date.now() + 60_000, badDomain = false,
  signedPayload = payload, idempotencyKey = randomUUID() } = {}) {
  const body = payload ? JSON.stringify(payload) : "";
  const messageBody = signedPayload ? JSON.stringify(signedPayload) : "";
  const signature = await signer.signMessage({ message: agentMessage({ domain: badDomain ? "other.local" : domain,
    method, path, body: Buffer.from(messageBody), nonce, expires }) });
  const response = await fetch(base + path, { method,
    headers: { "x-auditor-agent-badge": badge, "x-auditor-agent-nonce": nonce,
      "x-auditor-agent-expires": String(expires), "x-auditor-agent-signature": signature,
      ...(payload ? { "content-type": "application/json", "idempotency-key": idempotencyKey } : {}) },
    ...(payload ? { body } : {}) });
  return { status: response.status, data: await response.json() };
}

test("invited key signs scope, submission, job and private evidence access", async () => {
  await withServer(async base => {
    const scope = await signed(base, root);
    assert.equal(scope.status, 200);
    assert.equal(scope.data.actor.id, `agent:${badge}`);
    const submitted = await signed(base, `${root}/submissions`, { method: "POST",
      payload: { claim: "donation-share-inflation", targetSha256: DEMO_PROGRAM.targetSha256 } });
    assert.equal(submitted.status, 201);
    const job = await signed(base, `${root}/submissions/${submitted.data.id}/jobs`, { method: "POST",
      payload: { artifactFormat: "repo-fixture-v1", fixture: "vulnerable" } });
    assert.equal(job.status, 202);
    const evidence = await signed(base, `${root}/jobs/${job.data.id}`);
    assert.equal(evidence.status, 200);
    assert.equal(evidence.data.actorId, `agent:${badge}`);
    assert.equal(evidence.data.result.receipt.private, true);
    const team = await fetch(`${base}${root}/jobs/${job.data.id}`, { headers: { authorization: `Bearer ${teamToken}` } });
    assert.equal(team.status, 200);
    const legacy = await fetch(`${base}/v1/jobs/${job.data.id}`, { headers: { authorization: `Bearer ${token}` } });
    assert.equal(legacy.status, 404);
    assert.equal((await signed(base, `/v1/jobs/${job.data.id}`)).status, 401);
  });
});

test("replay, forged key, wrong domain, wrong program and invalid fixture fail", async () => {
  await withServer(async base => {
    const nonce = randomUUID();
    assert.equal((await signed(base, root, { nonce })).status, 200);
    assert.equal((await signed(base, root, { nonce })).status, 401);
    assert.equal((await signed(base, root, { signer: privateKeyToAccount(`0x${"22".repeat(32)}`) })).status, 401);
    assert.equal((await signed(base, root, { badDomain: true })).status, 401);
    assert.equal((await signed(base, `${root}/submissions`, { method: "POST",
      payload: { claim: "donation-share-inflation", targetSha256: DEMO_PROGRAM.targetSha256 },
      signedPayload: { claim: "other", targetSha256: DEMO_PROGRAM.targetSha256 } })).status, 401);
    assert.equal((await signed(base, "/v1/programs/other")).status, 404);
    assert.equal((await signed(base, `${root}/submissions`, { method: "POST",
      payload: { claim: "donation-share-inflation", targetSha256: "wrong" } })).status, 400);
    const item = await signed(base, `${root}/submissions`, { method: "POST",
      payload: { claim: "donation-share-inflation", targetSha256: DEMO_PROGRAM.targetSha256 } });
    const retryKey = randomUUID();
    const first = await signed(base, `${root}/submissions`, { method: "POST", idempotencyKey: retryKey,
      payload: { claim: "donation-share-inflation", targetSha256: DEMO_PROGRAM.targetSha256 } });
    const retry = await signed(base, `${root}/submissions`, { method: "POST", idempotencyKey: retryKey,
      payload: { claim: "donation-share-inflation", targetSha256: DEMO_PROGRAM.targetSha256 } });
    assert.equal(retry.data.id, first.data.id);
    assert.equal((await signed(base, `${root}/submissions/${item.data.id}/jobs`, { method: "POST",
      payload: { artifactFormat: "repo-fixture-v1", fixture: "external" } })).status, 400);
    assert.equal((await signed(base, `${root}/jobs/${randomUUID()}`)).status, 404);
  });
});

test("concurrent copies of one signed POST consume the nonce once", async () => {
  const payload = { claim: "donation-share-inflation", targetSha256: DEMO_PROGRAM.targetSha256 };
  const nonce = randomUUID();
  await withServer(async base => {
    const attempts = await Promise.all([1, 2].map(() => signed(base, `${root}/submissions`, {
      method: "POST", payload, nonce, idempotencyKey: randomUUID(),
    })));
    assert.deepEqual(attempts.map(item => item.status).sort(), [201, 401]);
    const listing = await fetch(`${base}${root}/submissions`, {
      headers: { authorization: `Bearer ${teamToken}` },
    });
    assert.equal((await listing.json()).submissions.length, 1);
  }, { lookupAgent: async () => {
    await new Promise(resolve => setTimeout(resolve, 25));
    return registryState();
  } });
});

test("missing invitation, expiry, revoked badge, stale card, and unlinked CIS-8 key fail closed", async () => {
  await withServer(async base => {
    assert.equal((await signed(base, root)).status, 401);
  }, { invitedAgentBadges: [] });
  await withServer(async base => {
    assert.equal((await signed(base, root, { expires: Date.now() - 1 })).status, 401);
    assert.equal((await signed(base, root, { expires: Date.now() + 10 * 60_000 })).status, 401);
  });
  for (const mutate of [
    state => { state.agent.status = "Revoked"; },
    state => { state.check.on_chain.status = "Revoked"; },
    state => { state.check.card_sha256 = "b".repeat(64); },
    state => { state.binding.status = "Revoked"; },
    state => { state.binding.owner = "other-owner"; },
    state => { state.agent.external_reference = null; },
    state => { state.agent.expires_at = new Date(Date.now() - 1000).toISOString(); },
    state => { state.binding.expires_at = new Date(Date.now() - 1000).toISOString(); },
  ]) {
    const state = registryState();
    mutate(state);
    await withServer(async base => assert.equal((await signed(base, root)).status, 401), { state });
  }
});
