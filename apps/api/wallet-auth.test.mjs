import test from "node:test";
import assert from "node:assert/strict";
import { generateKeyPairSync } from "node:crypto";
import { AccountAddress, buildBasicAccountSigner, signMessage } from "@concordium/web-sdk";
import { createApiServer } from "./server.mjs";
import { DEMO_PROGRAM } from "./program.mjs";
import { CHALLENGE_TTL_MS, SESSION_COOKIE } from "./wallet-auth.mjs";

const token = "operator-token-with-at-least-thirty-two-characters";
const teamToken = "team-token-with-at-least-thirty-two-characters-ok";
const researcherToken = "researcher-token-with-at-least-thirty-two-chars-ok";

function makeWalletIdentity(seedByte) {
  const { publicKey, privateKey } = generateKeyPairSync("ed25519");
  const pubDer = publicKey.export({ format: "der", type: "spki" });
  const privDer = privateKey.export({ format: "der", type: "pkcs8" });
  const publicKeyHex = pubDer.subarray(pubDer.length - 32).toString("hex");
  const privateKeyHex = privDer.subarray(privDer.length - 32).toString("hex");
  const rawAddress = Buffer.alloc(32, seedByte);
  const address = AccountAddress.fromBuffer(rawAddress);
  const signer = buildBasicAccountSigner(privateKeyHex);
  const accountInfo = {
    accountAddress: address,
    accountThreshold: 1,
    accountCredentials: {
      0: {
        value: {
          contents: {
            credentialPublicKeys: {
              keys: { 0: { verifyKey: publicKeyHex, schemeId: "Ed25519" } },
              threshold: 1,
            },
          },
        },
      },
    },
  };
  return {
    account: address.address,
    address,
    accountInfo,
    sign: message => signMessage(address, message, signer),
  };
}

const teamWallet = makeWalletIdentity(0x11);
const researcherWallet = makeWalletIdentity(0x22);
const outsiderWallet = makeWalletIdentity(0x33);
const lookupMap = new Map([
  [teamWallet.account, teamWallet.accountInfo],
  [researcherWallet.account, researcherWallet.accountInfo],
  [outsiderWallet.account, outsiderWallet.accountInfo],
]);

async function startServer(options = {}) {
  const server = createApiServer({
    token,
    teamToken,
    researcherToken,
    teamAccounts: [teamWallet.account],
    invitedResearcherAccounts: [researcherWallet.account],
    lookupAccountInfo: async account => {
      const info = lookupMap.get(account);
      if (!info) throw new Error("account not found");
      return info;
    },
    execute: async (_kind, body) => ({
      status: body.fixture === "vulnerable" ? "reproduced" : "not_reproduced",
      receipt: { input: { sourceSha256: DEMO_PROGRAM.workerInputSha256 } },
    }),
    ...options,
  });
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address();
  return {
    base: `http://127.0.0.1:${port}`,
    close: () => new Promise((resolve, reject) => server.close(err => err ? reject(err) : resolve())),
  };
}

function extractCookiePair(setCookie) {
  assert.ok(typeof setCookie === "string" && setCookie.startsWith(`${SESSION_COOKIE}=`));
  return setCookie.split(";")[0];
}

async function loginWallet(base, wallet, origin = "http://127.0.0.1:3000", extraHeaders = {}) {
  const challengeRes = await fetch(`${base}/v1/auth/concordium/challenge`, {
    method: "POST",
    headers: { "content-type": "application/json", origin, ...extraHeaders },
    body: JSON.stringify({ account: wallet.account }),
  });
  assert.equal(challengeRes.status, 200);
  const challenge = await challengeRes.json();
  const signature = await wallet.sign(challenge.message);
  const verifyRes = await fetch(`${base}/v1/auth/concordium/verify`, {
    method: "POST",
    headers: { "content-type": "application/json", origin, ...extraHeaders },
    body: JSON.stringify({ challengeId: challenge.challengeId, account: wallet.account, signature }),
  });
  return { challenge, verifyRes, setCookie: verifyRes.headers.get("set-cookie"), body: await verifyRes.json() };
}

test("valid Concordium wallet login sets secure HttpOnly cookie, enforces server roles, and revokes on logout", async () => {
  const { base, close } = await startServer();
  const origin = "http://127.0.0.1:3000";
  try {
    const anon = await fetch(`${base}/v1/auth/me`);
    assert.equal(anon.status, 200);
    assert.deepEqual(await anon.json(), { authenticated: false });

    const login = await loginWallet(base, teamWallet, origin, { "x-forwarded-proto": "https" });
    assert.equal(login.verifyRes.status, 200);
    assert.match(login.setCookie, /HttpOnly/);
    assert.match(login.setCookie, /SameSite=Lax/);
    assert.match(login.setCookie, /Secure/);
    assert.equal(login.body.authenticated, true);
    assert.equal(login.body.account, teamWallet.account);
    assert.equal(login.body.programRoles["demo-vault"], "team");
    assert.ok(typeof login.body.csrfToken === "string" && login.body.csrfToken.length >= 32);

    const cookie = extractCookiePair(login.setCookie);
    const me = await fetch(`${base}/v1/auth/me`, { headers: { cookie } });
    assert.equal(me.status, 200);
    assert.equal((await me.json()).account, teamWallet.account);

    // Server-derived team role grants Demo Vault read access without a bearer token.
    const scope = await fetch(`${base}/v1/programs/demo-vault`, { headers: { cookie } });
    assert.equal(scope.status, 200);
    const scopeData = await scope.json();
    assert.equal(scopeData.actor.role, "team");
    assert.equal(scopeData.actor.account, teamWallet.account);

    // CSRF protection rejects logout without CSRF token or with wrong origin.
    const badCsrf = await fetch(`${base}/v1/auth/logout`, { method: "POST", headers: { cookie, origin } });
    assert.equal(badCsrf.status, 403);
    const badOrigin = await fetch(`${base}/v1/auth/logout`, {
      method: "POST",
      headers: { cookie, origin: "https://evil.example", "x-auditor-csrf": login.body.csrfToken },
    });
    assert.equal(badOrigin.status, 403);

    // Valid logout revokes the session and clears the cookie.
    const logout = await fetch(`${base}/v1/auth/logout`, {
      method: "POST",
      headers: { cookie, origin, "x-auditor-csrf": login.body.csrfToken, "x-forwarded-proto": "https" },
    });
    assert.equal(logout.status, 200);
    assert.match(logout.headers.get("set-cookie"), /Max-Age=0/);
    assert.match(logout.headers.get("set-cookie"), /Secure/);

    // Reusing the revoked session cookie fails closed.
    const afterLogout = await fetch(`${base}/v1/auth/me`, { headers: { cookie } });
    assert.deepEqual(await afterLogout.json(), { authenticated: false });
    const deniedScope = await fetch(`${base}/v1/programs/demo-vault`, { headers: { cookie } });
    assert.equal(deniedScope.status, 401);
  } finally {
    await close();
  }
});

test("wrong account, nonce replay, expired challenge, forged signature, and disallowed origin are denied", async () => {
  let clock = 1_760_000_000_000;
  const { base, close } = await startServer({ now: () => clock });
  const origin = "http://127.0.0.1:3000";
  try {
    // Disallowed origin rejected at challenge issuance.
    const evilOrigin = await fetch(`${base}/v1/auth/concordium/challenge`, {
      method: "POST",
      headers: { "content-type": "application/json", origin: "https://attacker.example" },
      body: JSON.stringify({ account: teamWallet.account }),
    });
    assert.equal(evilOrigin.status, 403);

    // Forged signature (signed by wrong wallet) rejected.
    const c1 = await (await fetch(`${base}/v1/auth/concordium/challenge`, {
      method: "POST",
      headers: { "content-type": "application/json", origin },
      body: JSON.stringify({ account: teamWallet.account }),
    })).json();
    const forgedSig = await outsiderWallet.sign(c1.message);
    const forgedRes = await fetch(`${base}/v1/auth/concordium/verify`, {
      method: "POST",
      headers: { "content-type": "application/json", origin },
      body: JSON.stringify({ challengeId: c1.challengeId, account: teamWallet.account, signature: forgedSig }),
    });
    assert.equal(forgedRes.status, 401);

    // Wrong account on verify rejected.
    const validSig = await teamWallet.sign(c1.message);
    const wrongAccount = await fetch(`${base}/v1/auth/concordium/verify`, {
      method: "POST",
      headers: { "content-type": "application/json", origin },
      body: JSON.stringify({ challengeId: c1.challengeId, account: outsiderWallet.account, signature: validSig }),
    });
    assert.equal(wrongAccount.status, 401);

    // First valid verify succeeds, second replay of the exact same challenge fails.
    const ok = await fetch(`${base}/v1/auth/concordium/verify`, {
      method: "POST",
      headers: { "content-type": "application/json", origin },
      body: JSON.stringify({ challengeId: c1.challengeId, account: teamWallet.account, signature: validSig }),
    });
    assert.equal(ok.status, 200);
    const replay = await fetch(`${base}/v1/auth/concordium/verify`, {
      method: "POST",
      headers: { "content-type": "application/json", origin },
      body: JSON.stringify({ challengeId: c1.challengeId, account: teamWallet.account, signature: validSig }),
    });
    assert.equal(replay.status, 401);

    // Expired challenge rejected.
    const c2 = await (await fetch(`${base}/v1/auth/concordium/challenge`, {
      method: "POST",
      headers: { "content-type": "application/json", origin },
      body: JSON.stringify({ account: teamWallet.account }),
    })).json();
    const sig2 = await teamWallet.sign(c2.message);
    clock += CHALLENGE_TTL_MS + 1;
    const expired = await fetch(`${base}/v1/auth/concordium/verify`, {
      method: "POST",
      headers: { "content-type": "application/json", origin },
      body: JSON.stringify({ challengeId: c2.challengeId, account: teamWallet.account, signature: sig2 }),
    });
    assert.equal(expired.status, 401);
  } finally {
    await close();
  }
});

test("client onboarding role picker cannot grant Demo Vault authority or bypass CSRF", async () => {
  const { base, close } = await startServer();
  const origin = "http://127.0.0.1:3000";
  try {
    const login = await loginWallet(base, outsiderWallet, origin);
    assert.equal(login.verifyRes.status, 200);
    assert.deepEqual(login.body.programRoles, {});
    const cookie = extractCookiePair(login.setCookie);

    // Requesting onboarding role without CSRF fails.
    const noCsrf = await fetch(`${base}/v1/auth/role`, {
      method: "POST",
      headers: { "content-type": "application/json", cookie, origin },
      body: JSON.stringify({ requestedRole: "team" }),
    });
    assert.equal(noCsrf.status, 403);

    // Requesting onboarding role with CSRF stores preference only; programRoles stays empty.
    const roleRes = await fetch(`${base}/v1/auth/role`, {
      method: "POST",
      headers: { "content-type": "application/json", cookie, origin, "x-auditor-csrf": login.body.csrfToken },
      body: JSON.stringify({ requestedRole: "team" }),
    });
    assert.equal(roleRes.status, 200);
    const updated = await roleRes.json();
    assert.equal(updated.onboardingRole, "team");
    assert.deepEqual(updated.programRoles, {});

    // Outsider still cannot access Demo Vault despite choosing "team" in onboarding.
    const denied = await fetch(`${base}/v1/programs/demo-vault`, { headers: { cookie } });
    assert.equal(denied.status, 403);

    // Invited researcher wallet can submit with CSRF, but fails without CSRF.
    const resLogin = await loginWallet(base, researcherWallet, origin);
    const resCookie = extractCookiePair(resLogin.setCookie);
    const noCsrfSubmit = await fetch(`${base}/v1/programs/demo-vault/submissions`, {
      method: "POST",
      headers: { "content-type": "application/json", cookie: resCookie, origin, "idempotency-key": "wallet-csrf-1" },
      body: JSON.stringify({ claim: "donation-share-inflation", targetSha256: DEMO_PROGRAM.targetSha256 }),
    });
    assert.equal(noCsrfSubmit.status, 403);
    const okSubmit = await fetch(`${base}/v1/programs/demo-vault/submissions`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        cookie: resCookie,
        origin,
        "x-auditor-csrf": resLogin.body.csrfToken,
        "idempotency-key": "wallet-csrf-2",
      },
      body: JSON.stringify({ claim: "donation-share-inflation", targetSha256: DEMO_PROGRAM.targetSha256 }),
    });
    assert.equal(okSubmit.status, 201);
  } finally {
    await close();
  }
});
