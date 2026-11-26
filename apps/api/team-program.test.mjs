import test from "node:test";
import assert from "node:assert/strict";
import { generateKeyPairSync, randomUUID } from "node:crypto";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { AccountAddress, buildBasicAccountSigner, signMessage } from "@concordium/web-sdk";
import { privateKeyToAccount } from "viem/accounts";
import { createApiServer } from "./server.mjs";
import { agentMessage } from "./agent-auth.mjs";
import { generateAgentSetup } from "./agent-setup.mjs";

const origin = "http://127.0.0.1:3000";
const token = "operator-token-with-at-least-thirty-two-characters";
function identity(byte) {
  const { publicKey, privateKey } = generateKeyPairSync("ed25519");
  const pub = publicKey.export({ format: "der", type: "spki" });
  const priv = privateKey.export({ format: "der", type: "pkcs8" });
  const address = AccountAddress.fromBuffer(new Uint8Array(32).fill(byte).buffer);
  return { account: address.address, sign: message => signMessage(address, message,
    buildBasicAccountSigner(priv.subarray(priv.length - 32).toString("hex"))),
  accountInfo: { accountAddress: address, accountThreshold: 1, accountCredentials: {
    0: { value: { contents: { credentialPublicKeys: { keys: {
      0: { verifyKey: pub.subarray(pub.length - 32).toString("hex"), schemeId: "Ed25519" },
    }, threshold: 1 } } } },
  } } };
}
const owner = identity(0x51);
const researcher = identity(0x52);
const outsider = identity(0x53);
const secondOwner = identity(0x54);
const identities = new Map([owner, researcher, outsider, secondOwner].map(item => [item.account, item.accountInfo]));
const draft = { name: "Scoped Vault Review", sourceUrl: "https://github.com/example/review",
  sourceRevision: "a".repeat(40), chain: "evm-local", confidentiality: "members-only", visibility: "private",
  contact: "team@example.com", docsUrl: "https://example.com/docs", agentContext: "Use the pinned local source.",
  rewardCurrency: "USD", rewardTiers: ["critical", "high", "medium", "low", "informational"]
    .map(severity => ({ severity, min: 0, max: 0 })),
  references: [{ kind: "source", name: "Library", url: "https://github.com/example/library" }],
  permittedTargets: ["contracts/Vault.sol"], rules: "Local fork only; reviewed source revision.",
  exclusions: "No deployed contracts or third-party systems.", runLimit: 4,
  invitedResearcherAccounts: [researcher.account], invitedAgentBadges: [] };

async function server(filePath) {
  const app = createApiServer({ token, teamToken: "team-token-with-at-least-thirty-two-characters",
    researcherToken: "researcher-token-with-at-least-thirty-two-characters",
    teamAccounts: [owner.account, secondOwner.account], programStorePath: filePath,
    lookupAccountInfo: async account => identities.get(account) ?? null });
  await new Promise(resolve => app.listen(0, "127.0.0.1", resolve));
  return { base: `http://127.0.0.1:${app.address().port}`,
    close: () => new Promise(resolve => app.close(resolve)) };
}
async function login(base, person) {
  const challenge = await (await fetch(`${base}/v1/auth/concordium/challenge`, { method: "POST",
    headers: { origin, "content-type": "application/json" }, body: JSON.stringify({ account: person.account }) })).json();
  const response = await fetch(`${base}/v1/auth/concordium/verify`, { method: "POST",
    headers: { origin, "content-type": "application/json" }, body: JSON.stringify({
      account: person.account, challengeId: challenge.challengeId, signature: await person.sign(challenge.message),
    }) });
  assert.equal(response.status, 200);
  return { cookie: response.headers.get("set-cookie").split(";")[0], csrf: (await response.json()).csrfToken };
}
async function call(base, path, credentials, body) {
  const response = await fetch(base + path, { method: body ? "POST" : "GET", headers: {
    ...(credentials ? { cookie: credentials.cookie } : {}), ...(body ? { origin, "x-auditor-csrf": credentials?.csrf ?? "",
      "content-type": "application/json" } : {}),
  }, ...(body ? { body: JSON.stringify(body) } : {}) });
  return { status: response.status, data: await response.json() };
}

test("team-owned program persists and grants only invited private reads", async () => {
  const dir = mkdtempSync(join(tmpdir(), "auditor-program-"));
  const file = join(dir, "programs.json");
  try {
    let app = await server(file);
    const o = await login(app.base, owner);
    const r = await login(app.base, researcher);
    const x = await login(app.base, outsider);
    const other = await login(app.base, secondOwner);
    assert.equal((await call(app.base, "/v1/programs", null, draft)).status, 403);
    assert.equal((await call(app.base, "/v1/programs", r, draft)).status, 403);
    assert.equal((await call(app.base, "/v1/programs", o, { ...draft, ownerAccount: outsider.account })).status, 400);
    assert.equal((await call(app.base, "/v1/programs", o, { ...draft, sourceRevision: "not-pinned" })).status, 400);
    const created = await call(app.base, "/v1/programs", o, draft);
    assert.equal(created.status, 201);
    const id = created.data.program.id;
    assert.equal(created.data.program.ownerAccount, owner.account);
    assert.equal(created.data.program.verification, "not-configured");
    assert.equal(created.data.program.contact, draft.contact);
    assert.equal(created.data.program.agentContext, draft.agentContext);
    assert.deepEqual(created.data.program.references, draft.references);
    assert.equal((await call(app.base, "/v1/programs/mine", o)).data.programs[0].id, id);
    assert.deepEqual((await call(app.base, "/v1/programs/mine", other)).data.programs, []);
    assert.equal((await call(app.base, `/v1/programs/${id}`, other)).status, 404);
    assert.equal((await call(app.base, `/v1/programs/${randomUUID()}`, r)).status, 404);
    assert.equal((await call(app.base, `/v1/programs/${id}`, r)).status, 200);
    assert.equal((await call(app.base, `/v1/programs/${id}`, x)).status, 404);
    assert.equal((await call(app.base, `/v1/programs/${id}/jobs/${randomUUID()}`, r)).status, 403);
    assert.equal((await call(app.base, `/v1/programs/${id}/invitations`, o,
      { action: "invite", kind: "researcher-account", value: outsider.account })).status, 200);
    assert.deepEqual((await call(app.base, `/v1/programs/${id}`, r)).data.program.invitedResearcherAccounts,
      [researcher.account]);
    await app.close();
    app = await server(file);
    assert.equal((await call(app.base, `/v1/programs/${id}`, o)).status, 404);
    const relogin = await login(app.base, owner);
    assert.equal((await call(app.base, `/v1/programs/${id}`, relogin)).data.program.sourceRevision, draft.sourceRevision);
    assert.equal((await call(app.base, `/v1/programs/${id}`, relogin)).data.program.docsUrl, draft.docsUrl);
    const rejoined = await login(app.base, outsider);
    assert.equal((await call(app.base, `/v1/programs/${id}`, rejoined)).status, 200);
    await app.close();
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test("owner revokes researcher and cross-program writes fail", async () => {
  const app = await server(null);
  try {
    const o = await login(app.base, owner);
    const r = await login(app.base, researcher);
    const x = await login(app.base, secondOwner);
    const created = await call(app.base, "/v1/programs", o, draft);
    const id = created.data.program.id;
    assert.equal((await call(app.base, `/v1/programs/${id}/invitations`, r,
      { action: "revoke", kind: "researcher-account", value: researcher.account })).status, 403);
    assert.equal((await call(app.base, `/v1/programs/${id}/status`, x, { status: "closed" })).status, 404);
    assert.equal((await call(app.base, `/v1/programs/${id}/invitations`, o,
      { action: "revoke", kind: "researcher-account", value: researcher.account })).status, 200);
    assert.equal((await call(app.base, `/v1/programs/${id}`, r)).status, 404);
    assert.deepEqual((await call(app.base, "/v1/programs/invited", r)).data.programs, []);
    assert.equal((await call(app.base, `/v1/programs/${id}/submissions`, o)).data.submissions.length, 0);
    assert.equal((await call(app.base, `/v1/programs/${id}/submissions`, r)).status, 404);
  } finally { await app.close(); }
});

test("CSRF, operator bypass, paused access, and quota boundaries fail closed", async () => {
  const app = await server(null);
  try {
    const o = await login(app.base, owner);
    const r = await login(app.base, researcher);
    const forged = await fetch(`${app.base}/v1/programs`, { method: "POST", headers: {
      origin, cookie: o.cookie, "content-type": "application/json" }, body: JSON.stringify(draft) });
    assert.equal(forged.status, 403);
    const bypass = await fetch(`${app.base}/v1/programs`, { method: "POST", headers: {
      authorization: `Bearer ${token}`, origin, "content-type": "application/json" }, body: JSON.stringify(draft) });
    assert.equal(bypass.status, 401);
    assert.equal((await call(app.base, "/v1/programs", o, { ...draft, runLimit: 21 })).status, 400);
    assert.equal((await call(app.base, "/v1/programs", o, { ...draft, chain: "evm-mainnet" })).status, 400);
    const created = await call(app.base, "/v1/programs", o, draft);
    const id = created.data.program.id;
    assert.equal((await call(app.base, `/v1/programs/${id}/status`, o, { status: "paused" })).status, 200);
    assert.equal((await call(app.base, `/v1/programs/${id}`, r)).status, 404);
    assert.equal((await call(app.base, `/v1/programs/${id}`, o)).status, 200);
    assert.equal((await call(app.base, `/v1/programs/${id}/status`, o, { status: "closed" })).status, 200);
    assert.equal((await call(app.base, `/v1/programs/${id}/status`, o, { status: "active" })).status, 400);
  } finally { await app.close(); }
});

test("a signed agent reads only its invited active program", async () => {
  const badge = "JyP9UhUtd9AeJywDRsg5q";
  const domain = "auditor.local";
  const key = privateKeyToAccount(`0x${"11".repeat(32)}`);
  const ownerName = "test-concordium-owner";
  const chain = "ccd:4221332d34e1694168c2a0c0b3fd0f27";
  const state = {
    check: { badge_valid: true, network: "testnet", token_address: badge,
      card_sha256: "a".repeat(64), on_chain: { owner_account: ownerName, status: "Active",
        agent_uri: "https://example.test/agent-card.json", metadata_hash_hex: "a".repeat(64) },
      checks: { hash_matches_on_chain: true }, expected: { chain,
        contracts: { cis8004: "12802,0", cis8: "12801,0" } } },
    agent: { network: "testnet", token_address: badge, owner_account: ownerName, status: "Active",
      metadata_hash_hex: "a".repeat(64), agent_uri: "https://example.test/agent-card.json",
      external_reference: { kind: "Cis8", contract_address: { index: 12801, subindex: 0 },
        key: { namespace: "eip155:8453", key_type: "secp256k1-uncompressed",
          public_key_hex: key.publicKey.slice(2) } } },
    binding: { status: "Active", owner: ownerName },
  };
  const app = createApiServer({ token, teamToken: "team-token-with-at-least-thirty-two-characters",
    researcherToken: "researcher-token-with-at-least-thirty-two-characters",
    teamAccounts: [owner.account], lookupAccountInfo: async account => identities.get(account) ?? null,
    agentDomain: domain, lookupAgent: async () => state });
  await new Promise(resolve => app.listen(0, "127.0.0.1", resolve));
  const base = `http://127.0.0.1:${app.address().port}`;
  async function signed(path, nonce = randomUUID()) {
    const expires = Date.now() + 60_000;
    const signature = await key.signMessage({ message: agentMessage({ domain, method: "GET", path,
      body: Buffer.alloc(0), nonce, expires }) });
    return fetch(base + path, { headers: { "x-auditor-agent-badge": badge,
      "x-auditor-agent-nonce": nonce, "x-auditor-agent-expires": String(expires),
      "x-auditor-agent-signature": signature } });
  }
  try {
    const o = await login(base, owner);
    const created = await call(base, "/v1/programs", o, { ...draft, invitedAgentBadges: [badge] });
    const id = created.data.program.id;
    assert.equal((await signed(`/v1/programs/${id}`)).status, 200);
    assert.equal((await signed(`/v1/programs/${randomUUID()}`)).status, 404);
    assert.equal((await call(base, `/v1/programs/${id}/invitations`, o,
      { action: "revoke", kind: "agent-badge", value: badge })).status, 200);
    assert.equal((await signed(`/v1/programs/${id}`)).status, 404);
  } finally { await new Promise(resolve => app.close(resolve)); }
});

test("public scope is discoverable without opening private references or job access", async () => {
  const app = await server(null);
  try {
    const o = await login(app.base, owner);
    const privateItem = await call(app.base, "/v1/programs", o, draft);
    const publicDraft = { ...draft, visibility: "public", invitedResearcherAccounts: [], invitedAgentBadges: [] };
    assert.equal((await call(app.base, "/v1/programs", o, { ...publicDraft, invitedResearcherAccounts: [researcher.account] })).status, 400);
    assert.equal((await call(app.base, "/v1/programs", o, { ...publicDraft,
      rewardTiers: [{ ...draft.rewardTiers[0], min: 5, max: 2 }, ...draft.rewardTiers.slice(1)] })).status, 400);
    assert.equal((await call(app.base, "/v1/programs", o, { ...publicDraft,
      references: [{ kind: "source", name: "Unsafe", url: "http://example.com" }] })).status, 400);
    const publicItem = await call(app.base, "/v1/programs", o, publicDraft);
    assert.equal(publicItem.status, 201);
    const id = publicItem.data.program.id;
    const publicListing = await call(app.base, "/v1/programs/public", null);
    assert.deepEqual(publicListing.data.programs.map(item => item.id), [id]);
    const scope = await call(app.base, `/v1/programs/${id}`, null);
    assert.equal(scope.status, 200);
    assert.equal(scope.data.actor.role, "visitor");
    assert.equal(scope.data.program.contact, undefined);
    assert.equal(scope.data.program.invitedResearcherAccounts, undefined);
    assert.equal((await call(app.base, `/v1/programs/${privateItem.data.program.id}`, null)).status, 404);
    assert.equal((await call(app.base, `/v1/programs/${id}/submissions`, null)).status, 404);
    assert.equal((await call(app.base, `/v1/programs/${id}/invitations`, o,
      { action: "invite", kind: "researcher-account", value: researcher.account })).status, 400);
    assert.equal((await call(app.base, `/v1/programs/${id}/status`, o, { status: "paused" })).status, 200);
    assert.deepEqual((await call(app.base, "/v1/programs/public", null)).data.programs, []);
  } finally { await app.close(); }
});

test("AI setup generation needs no wallet but enforces origin, field, input, and rate limits", async () => {
  const input = { field: "agentContext", name: draft.name, sourceUrl: draft.sourceUrl, sourceRevision: draft.sourceRevision,
    chain: draft.chain, permittedTargets: draft.permittedTargets.join("\n"), instructions: draft.rules,
    invariants: "No zero shares", exclusions: draft.exclusions, policy: "Local tests only",
    additionalContext: JSON.stringify({ rewards: draft.rewardTiers, references: draft.references }) };
  let calls = 0;
  const app = createApiServer({ token, teamAccounts: [owner.account],
    lookupAccountInfo: async account => identities.get(account) ?? null,
    generateSetup: async context => { calls++; assert.deepEqual(context, input);
      return { value: "Run local tests." }; } });
  await new Promise(resolve => app.listen(0, "127.0.0.1", resolve));
  const base = `http://127.0.0.1:${app.address().port}`;
  try {
    assert.equal((await fetch(`${base}/v1/programs/agent-setup`, { method: "POST",
      headers: { origin: "https://other.example", "content-type": "application/json" },
      body: JSON.stringify(input) })).status, 403);
    assert.equal((await call(base, "/v1/programs/agent-setup", null,
      { ...input, sourceRevision: "unbounded" })).status, 400);
    assert.equal((await call(base, "/v1/programs/agent-setup", null,
      { ...input, field: "other" })).status, 400);
    const generated = await call(base, "/v1/programs/agent-setup", null, input);
    assert.equal(generated.status, 200);
    assert.equal(generated.data.value, "Run local tests.");
    for (let i = 0; i < 4; i++) assert.equal((await call(base, "/v1/programs/agent-setup", null, input)).status, 200);
    assert.equal((await call(base, "/v1/programs/agent-setup", null, input)).status, 429);
    assert.equal(calls, 5);
  } finally { await new Promise(resolve => app.close(resolve)); }
  await assert.rejects(() => generateAgentSetup(input, { apiKey: "" }), { status: 503 });
  const generated = await generateAgentSetup(input, { apiKey: "test-key", fetcher: async (_url, options) => {
    assert.equal(options.headers.authorization, "Bearer test-key");
    assert.equal(JSON.parse(options.body).store, false);
    return { ok: true, json: async () => ({ status: "completed", output: [{ content: [{ type: "output_text",
      text: JSON.stringify({ value: "Check pinned source." }) }] }] }) };
  } });
  assert.equal(generated.value, "Check pinned source.");
});
