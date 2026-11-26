import test from "node:test";
import assert from "node:assert/strict";
import { generateKeyPairSync } from "node:crypto";
import { AccountAddress, buildBasicAccountSigner, signMessage } from "@concordium/web-sdk";
import { createApiServer } from "../../api/server.mjs";
import { GET, POST } from "../app/v1/[...segments]/route";

const token = "test-token-with-at-least-thirty-two-characters";
const teamToken = "test-team-token-with-at-least-thirty-two-characters";
const researcherToken = "test-researcher-token-with-at-least-thirty-two-characters";
const context = (...segments: string[]) => ({ params: Promise.resolve({ segments }) });

test("same-origin proxy forwards only allowed verification requests and backend auth", async () => {
  // The existing JavaScript API infers its options from a default empty object.
  // @ts-expect-error token is required and validated by createApiServer at runtime.
  const server = createApiServer({ token, teamToken, researcherToken, execute: async () => ({ status: "tool_error", reason: "test executor" }) });
  await new Promise<void>(resolve => server.listen(0, "127.0.0.1", resolve));
  const oldOrigin = process.env.AUDITOR_API_ORIGIN;
  process.env.AUDITOR_API_ORIGIN = `http://127.0.0.1:${(server.address() as { port: number }).port}`;
  try {
    const request = (fixture: string, auth = token, key = "proxytestkey") => new Request("http://localhost:3000/v1/verify-poc", {
      method: "POST", headers: { authorization: `Bearer ${auth}`, "content-type": "application/json", "idempotency-key": key },
      body: JSON.stringify({ artifactFormat: "repo-fixture-v1", fixture }),
    });
    const denied = await POST(request("vulnerable", "wrong", "proxydenied"), context("verify-poc"));
    assert.equal(denied.status, 401);
    const invalid = await POST(request("external", token, "proxyinvalid"), context("verify-poc"));
    assert.equal(invalid.status, 400);
    const accepted = await POST(request("vulnerable"), context("verify-poc"));
    assert.equal(accepted.status, 202);
    const job = await accepted.json();
    assert.match(job.id, /^[a-f0-9-]{36}$/);
    const status = await GET(new Request(`http://localhost:3000/v1/jobs/${job.id}`, { headers: { authorization: `Bearer ${token}` } }), context("jobs", job.id));
    assert.equal(status.status, 200);
    assert.equal((await status.json()).fixture, "vulnerable");
    assert.equal((await POST(request("vulnerable"), context("scan"))).status, 404);
    assert.equal((await GET(new Request("http://localhost:3000/v1/jobs/../bad"), context("jobs", "../bad"))).status, 404);
    assert.equal((await POST(request("x".repeat(5000), token, "proxylarge"), context("verify-poc"))).status, 413);
    const scopePath = "http://localhost:3000/v1/programs/demo-vault";
    assert.equal((await GET(new Request(scopePath, { headers: { authorization: `Bearer ${token}` } }), context("programs", "demo-vault"))).status, 401);
    const scope = await GET(new Request(scopePath, { headers: { authorization: `Bearer ${teamToken}` } }), context("programs", "demo-vault"));
    assert.equal((await scope.json()).actor.role, "team");
    const submitted = await POST(new Request(`${scopePath}/submissions`, { method: "POST", headers: {
      authorization: `Bearer ${researcherToken}`, "content-type": "application/json", "idempotency-key": "proxy-claim-key" },
      body: JSON.stringify({ claim: "donation-share-inflation", targetSha256: "0151b8d3c7e0dfa8cb1851f4663761e06c4e676c50df31b0acd1baf4acfa1eb1" }),
    }), context("programs", "demo-vault", "submissions"));
    assert.equal(submitted.status, 201);
    assert.equal((await POST(request("vulnerable", researcherToken, "role-legacy-key"), context("verify-poc"))).status, 401);
  } finally {
    if (oldOrigin === undefined) delete process.env.AUDITOR_API_ORIGIN;
    else process.env.AUDITOR_API_ORIGIN = oldOrigin;
    await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
  }
});

test("same-origin proxy forwards Concordium wallet auth, session cookies, and CSRF headers", async () => {
  const { publicKey, privateKey } = generateKeyPairSync("ed25519");
  const pubDer = publicKey.export({ format: "der", type: "spki" });
  const privDer = privateKey.export({ format: "der", type: "pkcs8" });
  const publicKeyHex = pubDer.subarray(pubDer.length - 32).toString("hex");
  const privateKeyHex = privDer.subarray(privDer.length - 32).toString("hex");
  const address = AccountAddress.fromBuffer(new Uint8Array(32).fill(0x44).buffer);
  const signer = buildBasicAccountSigner(privateKeyHex);
  const accountInfo = {
    accountAddress: address,
    accountThreshold: 1,
    accountCredentials: {
      0: { value: { contents: { credentialPublicKeys: { keys: { 0: { verifyKey: publicKeyHex, schemeId: "Ed25519" } }, threshold: 1 } } } },
    },
  };
  const serverOptions = {
    token,
    teamToken,
    researcherToken,
    teamAccounts: [address.address],
    lookupAccountInfo: async (acc: string) => {
      if (acc !== address.address) throw new Error("not found");
      return accountInfo;
    },
    execute: async () => ({ status: "tool_error", reason: "test executor" }),
  };
  const server = createApiServer(serverOptions as unknown as Parameters<typeof createApiServer>[0]);
  await new Promise<void>(resolve => server.listen(0, "127.0.0.1", resolve));
  const oldOrigin = process.env.AUDITOR_API_ORIGIN;
  process.env.AUDITOR_API_ORIGIN = `http://127.0.0.1:${(server.address() as { port: number }).port}`;
  try {
    const origin = "http://localhost:3000";
    const challengeRes = await POST(new Request(`${origin}/v1/auth/concordium/challenge`, {
      method: "POST",
      headers: { "content-type": "application/json", origin },
      body: JSON.stringify({ account: address.address }),
    }), context("auth", "concordium", "challenge"));
    assert.equal(challengeRes.status, 200);
    const challenge = await challengeRes.json();
    const signature = await signMessage(address, challenge.message, signer);

    const verifyRes = await POST(new Request(`${origin}/v1/auth/concordium/verify`, {
      method: "POST",
      headers: { "content-type": "application/json", origin },
      body: JSON.stringify({ challengeId: challenge.challengeId, account: address.address, signature }),
    }), context("auth", "concordium", "verify"));
    assert.equal(verifyRes.status, 200);
    const setCookie = verifyRes.headers.get("set-cookie");
    assert.ok(setCookie && /HttpOnly/.test(setCookie) && /SameSite=Lax/.test(setCookie));
    const verified = await verifyRes.json();
    assert.equal(verified.programRoles["demo-vault"], "team");
    const cookie = setCookie.split(";")[0];

    const meRes = await GET(new Request(`${origin}/v1/auth/me`, { headers: { cookie } }), context("auth", "me"));
    assert.equal(meRes.status, 200);
    assert.equal((await meRes.json()).account, address.address);

    const programRes = await POST(new Request(`${origin}/v1/programs`, { method: "POST",
      headers: { cookie, origin, "x-auditor-csrf": verified.csrfToken, "content-type": "application/json" },
      body: JSON.stringify({ name: "Proxy vault", sourceUrl: "https://github.com/example/vault",
        sourceRevision: "a".repeat(40), chain: "evm-local", confidentiality: "members-only", visibility: "private",
        contact: "", docsUrl: "", agentContext: "", rewardCurrency: "USD",
        rewardTiers: ["critical", "high", "medium", "low", "informational"].map(severity => ({ severity, min: 0, max: 0 })),
        references: [],
        permittedTargets: ["contracts/Vault.sol"], rules: "Local only", exclusions: "Production",
        runLimit: 2, invitedResearcherAccounts: [], invitedAgentBadges: [] }),
    }), context("programs"));
    assert.equal(programRes.status, 201);
    const programId = (await programRes.json()).program.id;
    const privateProgram = await GET(new Request(`${origin}/v1/programs/${programId}`, { headers: { cookie } }),
      context("programs", programId));
    assert.equal(privateProgram.status, 200);
    assert.equal((await privateProgram.json()).program.ownerAccount, address.address);
    assert.equal((await GET(new Request(`${origin}/v1/programs/${programId}`), context("programs", programId))).status, 404);
    const publicList = await GET(new Request(`${origin}/v1/programs/public`), context("programs", "public"));
    assert.equal(publicList.status, 200);
    assert.deepEqual((await publicList.json()).programs, []);
    const incompleteSetup = await POST(new Request(`${origin}/v1/programs/agent-setup`, { method: "POST",
      headers: { cookie, origin, "x-auditor-csrf": verified.csrfToken, "content-type": "application/json" },
      body: JSON.stringify({}),
    }), context("programs", "agent-setup"));
    assert.equal(incompleteSetup.status, 400);

    const logoutRes = await POST(new Request(`${origin}/v1/auth/logout`, {
      method: "POST",
      headers: { cookie, origin, "x-auditor-csrf": verified.csrfToken },
    }), context("auth", "logout"));
    assert.equal(logoutRes.status, 200);
    assert.match(logoutRes.headers.get("set-cookie") ?? "", /Max-Age=0/);
  } finally {
    if (oldOrigin === undefined) delete process.env.AUDITOR_API_ORIGIN;
    else process.env.AUDITOR_API_ORIGIN = oldOrigin;
    await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
  }
});
