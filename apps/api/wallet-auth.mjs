import { createHash, randomBytes, randomUUID, timingSafeEqual } from "node:crypto";
import { AccountAddress, ConcordiumGRPCWebClient, verifyMessageSignature } from "@concordium/web-sdk";

export const SESSION_COOKIE = "veripoc_session";
export const TESTNET_CHAIN = "ccd:4221332d34e1694168c2a0c0b3fd0f27";
export const CHALLENGE_TTL_MS = 5 * 60_000;
export const SESSION_TTL_MS = 12 * 60 * 60_000;

const DEFAULT_GRPC_URL = "https://grpc.testnet.concordium.com";
const DEFAULT_GRPC_PORT = 20000;
const MAX_PENDING_CHALLENGES = 512;
const MAX_ACTIVE_SESSIONS = 512;

const sha256 = value => createHash("sha256").update(value).digest("hex");

export function normalizeOrigin(value) {
  if (typeof value !== "string" || !value.trim()) return null;
  try {
    const parsed = new URL(value);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;
    if (parsed.username || parsed.password) return null;
    return parsed.origin;
  } catch {
    return null;
  }
}

export function isValidConcordiumAccount(account) {
  if (typeof account !== "string" || account.length < 40 || account.length > 64) return false;
  try {
    AccountAddress.fromBase58(account);
    return true;
  } catch {
    return false;
  }
}

export function isValidAccountSignature(signature) {
  if (!signature || typeof signature !== "object" || Array.isArray(signature)) return false;
  const credEntries = Object.entries(signature);
  if (!credEntries.length || credEntries.length > 8) return false;
  for (const [credIndex, keyMap] of credEntries) {
    if (!/^[0-9]{1,2}$/.test(credIndex)) return false;
    if (!keyMap || typeof keyMap !== "object" || Array.isArray(keyMap)) return false;
    const keyEntries = Object.entries(keyMap);
    if (!keyEntries.length || keyEntries.length > 8) return false;
    for (const [keyIndex, hexSig] of keyEntries) {
      if (!/^[0-9]{1,2}$/.test(keyIndex)) return false;
      if (typeof hexSig !== "string" || !/^[0-9a-fA-F]{128}$/.test(hexSig)) return false;
    }
  }
  return true;
}

export function buildLoginMessage({ origin, account, nonce, expiresAt }) {
  return [
    "VeriPoC Concordium Wallet Login",
    `Origin: ${origin}`,
    `Network: ${TESTNET_CHAIN}`,
    `Account: ${account}`,
    `Nonce: ${nonce}`,
    `Expires: ${new Date(expiresAt).toISOString()}`,
  ].join("\n");
}

export function parseCookieHeader(header) {
  const cookies = new Map();
  if (typeof header !== "string" || !header) return cookies;
  for (const part of header.split(";")) {
    const idx = part.indexOf("=");
    if (idx <= 0) continue;
    const name = part.slice(0, idx).trim();
    const value = part.slice(idx + 1).trim();
    if (name && value && !cookies.has(name)) cookies.set(name, value);
  }
  return cookies;
}

export function formatSessionCookie(sessionId, { secure = false, maxAgeSeconds = Math.floor(SESSION_TTL_MS / 1000) } = {}) {
  const parts = [
    `${SESSION_COOKIE}=${sessionId}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${maxAgeSeconds}`,
  ];
  if (secure) parts.push("Secure");
  return parts.join("; ");
}

export function formatClearSessionCookie({ secure = false } = {}) {
  return formatSessionCookie("", { secure, maxAgeSeconds: 0 });
}

export async function lookupConcordiumAccountInfo(account, {
  grpcUrl = process.env.CONCORDIUM_GRPC_URL || DEFAULT_GRPC_URL,
  grpcPort = Number(process.env.CONCORDIUM_GRPC_PORT || DEFAULT_GRPC_PORT),
} = {}) {
  const address = AccountAddress.fromBase58(account);
  const client = new ConcordiumGRPCWebClient(grpcUrl, grpcPort, { timeout: 10_000 });
  return client.getAccountInfo(address);
}

export function equalSecret(a, b) {
  if (typeof a !== "string" || typeof b !== "string" || !a || !b) return false;
  return timingSafeEqual(Buffer.from(sha256(a)), Buffer.from(sha256(b)));
}

export function createWalletAuthStore({
  allowedOrigins = [],
  teamAccounts = [],
  invitedResearcherAccounts = [],
  lookupAccountInfo = lookupConcordiumAccountInfo,
  now = Date.now,
} = {}) {
  const normalizedAllowedOrigins = new Set(allowedOrigins.map(normalizeOrigin).filter(Boolean));
  const teamSet = new Set(teamAccounts.filter(isValidConcordiumAccount));
  const researcherSet = new Set(invitedResearcherAccounts.filter(isValidConcordiumAccount));
  const challenges = new Map();
  const sessions = new Map();
  const onboardingRoles = new Map();

  const prune = () => {
    const current = now();
    for (const [id, item] of challenges) {
      if (item.used || item.expiresAt <= current) challenges.delete(id);
    }
    for (const [hash, item] of sessions) {
      if (item.expiresAt <= current) sessions.delete(hash);
    }
  };

  const isOriginAllowed = origin => {
    const normalized = normalizeOrigin(origin);
    if (!normalized) return false;
    if (normalizedAllowedOrigins.size > 0) return normalizedAllowedOrigins.has(normalized);
    const { hostname } = new URL(normalized);
    return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "[::1]";
  };

  const programRolesFor = account => {
    const roles = {};
    if (teamSet.has(account)) roles["demo-vault"] = "team";
    else if (researcherSet.has(account)) roles["demo-vault"] = "researcher";
    return roles;
  };

  const sessionSummary = session => ({
    authenticated: true,
    account: session.account,
    onboardingRole: onboardingRoles.get(session.account) ?? null,
    programRoles: programRolesFor(session.account),
    csrfToken: session.csrfToken,
    expiresAt: session.expiresAt,
  });

  function issueChallenge({ account, origin }) {
    prune();
    if (!isValidConcordiumAccount(account)) {
      throw Object.assign(new Error("valid Concordium account address required"), { status: 400 });
    }
    const normalizedOrigin = normalizeOrigin(origin);
    if (!normalizedOrigin || !isOriginAllowed(normalizedOrigin)) {
      throw Object.assign(new Error("request origin is not allowed"), { status: 403 });
    }
    if (challenges.size >= MAX_PENDING_CHALLENGES) {
      const oldestKey = challenges.keys().next().value;
      if (oldestKey) challenges.delete(oldestKey);
    }
    const challengeId = randomUUID();
    const nonce = randomBytes(24).toString("hex");
    const expiresAt = now() + CHALLENGE_TTL_MS;
    const message = buildLoginMessage({ origin: normalizedOrigin, account, nonce, expiresAt });
    const record = { challengeId, account, origin: normalizedOrigin, nonce, message, expiresAt, used: false };
    challenges.set(challengeId, record);
    return { challengeId, account, origin: normalizedOrigin, nonce, message, expiresAt };
  }

  async function verifyLogin({ challengeId, account, origin, signature }) {
    prune();
    if (typeof challengeId !== "string" || !isValidConcordiumAccount(account) || !isValidAccountSignature(signature)) {
      throw Object.assign(new Error("invalid login verification payload"), { status: 400 });
    }
    const normalizedOrigin = normalizeOrigin(origin);
    if (!normalizedOrigin || !isOriginAllowed(normalizedOrigin)) {
      throw Object.assign(new Error("request origin is not allowed"), { status: 403 });
    }
    const challenge = challenges.get(challengeId);
    if (!challenge || challenge.used || challenge.expiresAt <= now()) {
      throw Object.assign(new Error("challenge is missing, expired, or already used"), { status: 401 });
    }
    if (challenge.account !== account || challenge.origin !== normalizedOrigin) {
      throw Object.assign(new Error("challenge does not match account or origin"), { status: 401 });
    }
    let accountInfo;
    try {
      accountInfo = await lookupAccountInfo(account);
    } catch {
      throw Object.assign(new Error("unable to verify Concordium account on-chain"), { status: 503 });
    }
    let valid = false;
    try {
      valid = Boolean(accountInfo && await verifyMessageSignature(challenge.message, signature, accountInfo));
    } catch {
      valid = false;
    }
    if (!valid) {
      throw Object.assign(new Error("invalid Concordium wallet signature"), { status: 401 });
    }
    // Atomic check-and-consume with no await in between to prevent concurrent replay.
    if (challenge.used || challenge.expiresAt <= now() || !challenges.has(challengeId)) {
      throw Object.assign(new Error("challenge already consumed"), { status: 401 });
    }
    challenge.used = true;
    challenges.delete(challengeId);

    if (sessions.size >= MAX_ACTIVE_SESSIONS) {
      const oldestKey = sessions.keys().next().value;
      if (oldestKey) sessions.delete(oldestKey);
    }
    const sessionId = randomBytes(32).toString("hex");
    const csrfToken = randomBytes(24).toString("hex");
    const session = {
      account,
      csrfToken,
      origin: normalizedOrigin,
      createdAt: now(),
      expiresAt: now() + SESSION_TTL_MS,
    };
    sessions.set(sha256(sessionId), session);
    return { sessionId, session: sessionSummary(session) };
  }

  function readSessionFromCookie(cookieHeader) {
    prune();
    const rawId = parseCookieHeader(cookieHeader).get(SESSION_COOKIE);
    if (!rawId || !/^[0-9a-f]{64}$/.test(rawId)) return null;
    const key = sha256(rawId);
    const session = sessions.get(key);
    if (!session || session.expiresAt <= now()) {
      sessions.delete(key);
      return null;
    }
    return { key, session };
  }

  function validateCsrf({ session, origin, csrfHeader }) {
    const normalizedOrigin = normalizeOrigin(origin);
    if (!normalizedOrigin || !isOriginAllowed(normalizedOrigin) || normalizedOrigin !== session.origin) {
      throw Object.assign(new Error("invalid request origin"), { status: 403 });
    }
    if (!equalSecret(csrfHeader, session.csrfToken)) {
      throw Object.assign(new Error("invalid CSRF token"), { status: 403 });
    }
  }

  function setOnboardingRole({ cookieHeader, origin, csrfHeader, requestedRole }) {
    const entry = readSessionFromCookie(cookieHeader);
    if (!entry) throw Object.assign(new Error("unauthorized"), { status: 401 });
    validateCsrf({ session: entry.session, origin, csrfHeader });
    if (requestedRole !== "team" && requestedRole !== "researcher") {
      throw Object.assign(new Error("requestedRole must be team or researcher"), { status: 400 });
    }
    onboardingRoles.set(entry.session.account, requestedRole);
    return sessionSummary(entry.session);
  }

  function logout({ cookieHeader, origin, csrfHeader }) {
    const entry = readSessionFromCookie(cookieHeader);
    if (!entry) throw Object.assign(new Error("unauthorized"), { status: 401 });
    validateCsrf({ session: entry.session, origin, csrfHeader });
    sessions.delete(entry.key);
    return { authenticated: false };
  }

  function getMe(cookieHeader) {
    const entry = readSessionFromCookie(cookieHeader);
    return entry ? sessionSummary(entry.session) : { authenticated: false };
  }

  function accountFromCookie({ cookieHeader, method, origin, csrfHeader }) {
    const entry = readSessionFromCookie(cookieHeader);
    if (!entry) return null;
    if (method !== "GET" && method !== "HEAD") {
      validateCsrf({ session: entry.session, origin, csrfHeader });
    }
    return entry.session.account;
  }

  function programActorFromCookie({ cookieHeader, method, origin, csrfHeader, programId }) {
    const entry = readSessionFromCookie(cookieHeader);
    if (!entry) return null;
    if (method !== "GET" && method !== "HEAD") {
      validateCsrf({ session: entry.session, origin, csrfHeader });
    }
    const role = programRolesFor(entry.session.account)[programId];
    if (!role) return null;
    return {
      id: `ccd:${entry.session.account}`,
      role,
      account: entry.session.account,
      authMethod: "concordium-wallet",
    };
  }

  return {
    issueChallenge,
    verifyLogin,
    readSessionFromCookie,
    getMe,
    accountFromCookie,
    setOnboardingRole,
    logout,
    programActorFromCookie,
    isOriginAllowed,
  };
}
