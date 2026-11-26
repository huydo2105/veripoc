import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { privateKeyToAccount } from "viem/accounts";
import { agentMessage, lookupConcordiumAgent } from "./agent-auth.mjs";

const [method, path, bodyFile] = process.argv.slice(2);
const badge = process.env.AUDITOR_AGENT_BADGE;
const domain = process.env.AUDITOR_AGENT_DOMAIN;
const privateKey = process.env.EVM_PRIVATE_KEY;
if (!badge || !domain || !/^0x[0-9a-fA-F]{64}$/.test(privateKey ?? ""))
  throw new Error("set AUDITOR_AGENT_BADGE, AUDITOR_AGENT_DOMAIN, and EVM_PRIVATE_KEY locally");
if (!/^(GET|POST)$/.test(method ?? "") || !/^\/v1\/programs\/demo-vault(?:\/|$)/.test(path ?? ""))
  throw new Error("usage: node apps/api/sign-agent-request.mjs GET|POST /v1/programs/demo-vault/... [body.json]");
if (method === "POST" && !bodyFile) throw new Error("POST requires a JSON body file");
if (method === "GET" && bodyFile) throw new Error("GET must not include a body file");
const body = bodyFile ? readFileSync(bodyFile) : Buffer.alloc(0);
if (body.length > 4096) throw new Error("body exceeds API limit");
const account = privateKeyToAccount(privateKey);
const { check, agent, binding } = await lookupConcordiumAgent(badge);
if (check.badge_valid !== true || agent.status !== "Active" || binding?.status !== "Active"
  || binding.owner !== agent.owner_account
  || agent.external_reference?.key?.public_key_hex?.toLowerCase() !== account.publicKey.slice(2).toLowerCase())
  throw new Error("local signing key is not the active CIS-8 key for this badge");
const nonce = randomUUID();
const expires = Date.now() + 60_000;
const signature = await account.signMessage({ message: agentMessage({ domain, method, path, body, nonce, expires }) });
const response = await fetch(`http://127.0.0.1:${process.env.AUDITOR_PORT ?? 8787}${path}`, {
  method, headers: { "x-auditor-agent-badge": badge, "x-auditor-agent-nonce": nonce,
    "x-auditor-agent-expires": String(expires), "x-auditor-agent-signature": signature,
    ...(bodyFile ? { "content-type": "application/json", "idempotency-key": randomUUID() } : {}) },
  ...(bodyFile ? { body } : {}),
});
console.log(`HTTP ${response.status}`);
console.log(await response.text());
if (!response.ok) process.exitCode = 1;
