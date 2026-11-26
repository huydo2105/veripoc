import { createHash } from "node:crypto";
import { hashMessage, recoverPublicKey } from "viem";

const REGISTRY = "https://agent-registry-mcp.concordium.com";
const TESTNET_CHAIN = "ccd:4221332d34e1694168c2a0c0b3fd0f27";
const EXPECTED_REGISTRY = "12802,0";
const MAX_SKEW_MS = 5 * 60_000;
const sha256 = bytes => createHash("sha256").update(bytes).digest("hex");

async function registryJson(url, options = {}) {
  const response = await fetch(url, { ...options, signal: AbortSignal.timeout(5000),
    headers: { accept: "application/json", ...options.headers } });
  if (!response.ok) throw new Error(`registry HTTP ${response.status}`);
  return response.json();
}

async function mcpTool(name, args) {
  const data = await registryJson(`${REGISTRY}/mcp`, { method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/call", params: { name, arguments: args } }) });
  if (data.error || data.result?.isError || data.result?.content?.[0]?.type !== "text")
    throw new Error("registry lookup failed");
  return JSON.parse(data.result.content[0].text);
}

/** Reads fresh public registry state for each signed request; an unavailable registry fails closed. */
export async function lookupConcordiumAgent(badge) {
  if (!/^[1-9A-HJ-NP-Za-km-z]{15,40}$/.test(badge)) throw new Error("invalid badge");
  const [check, agent] = await Promise.all([
    registryJson(`${REGISTRY}/v1/check-badge/${badge}`),
    mcpTool("agent_by_token_address", { network: "testnet", token_address: badge }),
  ]);
  const key = agent.external_reference?.key;
  if (!key) throw new Error("agent has no CIS-8 key");
  const binding = await mcpTool("owner_of_key", { network: "testnet", external_key: key });
  return { check, agent, binding };
}

export function agentMessage({ domain, method, path, body, nonce, expires }) {
  return ["auditor-agent-request-v1", domain, TESTNET_CHAIN, method, path,
    sha256(body), nonce, String(expires)].join("\n");
}

/** Badge identity, CIS-8 key control, invitation and request signature are independent checks. */
export async function authorizeAgentRequest({ headers, method, path, body, domain, invitedBadges,
  lookup = lookupConcordiumAgent, now = Date.now, usedNonces }) {
  const badge = headers["x-auditor-agent-badge"];
  const nonce = headers["x-auditor-agent-nonce"];
  const expiresRaw = headers["x-auditor-agent-expires"];
  const signature = headers["x-auditor-agent-signature"];
  if (typeof badge !== "string" || !invitedBadges.includes(badge)) return null;
  if (typeof domain !== "string" || !/^[a-zA-Z0-9.-]{3,100}$/.test(domain)
    || typeof nonce !== "string" || !/^[a-zA-Z0-9_-]{16,64}$/.test(nonce)
    || typeof expiresRaw !== "string" || !/^[0-9]{10,13}$/.test(expiresRaw)
    || typeof signature !== "string" || !/^0x[0-9a-fA-F]{130}$/.test(signature)) return null;
  const expires = Number(expiresRaw);
  const nonceKey = `${badge}:${nonce}`;
  if (!Number.isSafeInteger(expires) || expires <= now() || expires > now() + MAX_SKEW_MS
    || usedNonces.has(nonceKey)) return null;
  try {
    const { check, agent, binding } = await lookup(badge);
    const key = agent.external_reference?.key;
    const expectedOwner = agent.owner_account;
    if (check.badge_valid !== true || check.network !== "testnet"
      || check.token_address !== badge || check.on_chain?.status !== "Active"
      || check.on_chain.agent_uri !== agent.agent_uri
      || check.expected?.chain !== TESTNET_CHAIN
      || check.expected?.contracts?.cis8004 !== EXPECTED_REGISTRY
      || check.expected?.contracts?.cis8 !== "12801,0"
      || check.checks?.hash_matches_on_chain !== true
      || agent.network !== "testnet" || agent.token_address !== badge || agent.status !== "Active"
      || check.on_chain.owner_account !== expectedOwner
      || check.on_chain.metadata_hash_hex !== agent.metadata_hash_hex
      || check.card_sha256 !== agent.metadata_hash_hex
      || agent.external_reference?.kind !== "Cis8"
      || agent.external_reference?.contract_address?.index !== 12801
      || agent.external_reference?.contract_address?.subindex !== 0
      || key?.key_type !== "secp256k1-uncompressed" || key?.namespace !== "eip155:8453"
      || !/^04[0-9a-fA-F]{128}$/.test(key.public_key_hex)
      || binding?.status !== "Active" || binding?.owner !== expectedOwner
      || (agent.expires_at && Date.parse(agent.expires_at) <= now())
      || (binding.expires_at && Date.parse(binding.expires_at) <= now())) return null;
    const message = agentMessage({ domain, method, path, body, nonce, expires });
    const recovered = await recoverPublicKey({ hash: hashMessage(message), signature });
    if (recovered.toLowerCase() !== `0x${key.public_key_hex.toLowerCase()}`) return null;
    // No await between the final check and consumption: concurrent replays lose here.
    if (expires <= now() || usedNonces.has(nonceKey)) return null;
    usedNonces.set(nonceKey, expires);
    return { id: `agent:${badge}`, role: "researcher", badge };
  } catch { return null; }
}

export function pruneExpiredNonces(usedNonces, now) {
  for (const [key, expires] of usedNonces) if (expires <= now) usedNonces.delete(key);
}
