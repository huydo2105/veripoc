# Local verification API

The Node API is a separate loopback-only service at `http://127.0.0.1:8787`. The Next.js web app runs separately at `http://127.0.0.1:3000` and forwards only its supported verification requests. See [web setup](../web/README.md). The API no longer serves the public HTML pages. It still serves its original Agent Card bytes at `GET /.well-known/agent-card.json`.

Set a fresh token of at least 32 characters and start from the repository root:

```powershell
$tokenBytes = New-Object byte[] 32
$rng = [Security.Cryptography.RandomNumberGenerator]::Create()
$rng.GetBytes($tokenBytes)
$rng.Dispose()
$env:AUDITOR_API_TOKEN = ([BitConverter]::ToString($tokenBytes)).Replace('-', '').ToLower()
npm run api:dev
```

For the authorized local demo, also configure **two distinct** tokens of at least 32 characters before starting the API:

```powershell
$env:AUDITOR_TEAM_TOKEN = [Convert]::ToHexString([Security.Cryptography.RandomNumberGenerator]::GetBytes(32)).ToLower()
$env:AUDITOR_RESEARCHER_TOKEN = [Convert]::ToHexString([Security.Cryptography.RandomNumberGenerator]::GetBytes(32)).ToLower()
```

The three tokens must differ. `AUDITOR_API_TOKEN` remains the operator token for the original fixed-fixture and internal scan routes. Program tokens work only on `/v1/programs/demo-vault/...`; switching a page does not grant a program role. These are local server configured identities, not production accounts. Never put tokens in committed files or URLs.

### Optional signed Concordium agent access (Issue #12)

The API also accepts a **direct**, signed request from an explicitly invited CIS-8004 Testnet agent on the Demo Vault program routes. This does not replace the local team/researcher tokens or grant team powers. Configure a domain unique to this local API and the exact invited badge before starting it:

```powershell
$env:AUDITOR_AGENT_DOMAIN = 'auditor.local'
$env:AUDITOR_INVITED_AGENT_BADGES = 'JyP9UhUtd9AeJywDRsg5q'
npm run api:dev
```

The invitation is server configuration. A valid badge alone grants no access. Before enabling it, check the current public Testnet badge, Agent Card hash, and CIS-8 owner binding with `node apps/api/check-agent.mjs JyP9UhUtd9AeJywDRsg5q`. The API repeats those lookups on every signed request and fails closed if the registry is unavailable, revoked, stale, or unlinked. It uses Concordium's hosted registry service as a trusted resolver rather than querying a node independently. The registered key's operator must set `EVM_PRIVATE_KEY` locally; never send it to Auditor or commit it. To make one real signed scope request:

```powershell
$env:AUDITOR_AGENT_BADGE = 'JyP9UhUtd9AeJywDRsg5q'
$env:AUDITOR_AGENT_DOMAIN = 'auditor.local'
# Set EVM_PRIVATE_KEY in your private shell without printing it.
node apps/api/sign-agent-request.mjs GET /v1/programs/demo-vault
```

The helper checks that the local signing key is the active CIS-8 key before sending. For POST, pass a local JSON body file as the final argument and use an approved program path. The signed envelope has `X-Auditor-Agent-Badge`, `Nonce`, `Expires` (Unix milliseconds), and `Signature` headers. Its Ethereum personal-sign message is newline-delimited: `auditor-agent-request-v1`, configured domain, Testnet CAIP-2 chain, uppercase HTTP method, pathname, SHA-256 of exact request body bytes, nonce, expiry. A nonce is accepted once; expiry must be in the next five minutes. A retry after uncertain acceptance needs a **new signed nonce** and the same `Idempotency-Key`. This process-local replay cache and hosted resolver are demo constraints, not a durable production identity service. The browser proxy does not expose agent signing; the agent gateway is Issue #13.

`GET /v1/programs/demo-vault` returns scope and the API determined role. `GET /v1/programs/demo-vault/submissions` lists private claims. Only the invited researcher may `POST` the fixed `donation-share-inflation` claim and pinned target SHA-256 to that submissions path. They may then `POST` `{"artifactFormat":"repo-fixture-v1","fixture":"vulnerable"}` (or `"patched"`) to `/v1/programs/demo-vault/submissions/:id/jobs`. `GET /v1/programs/demo-vault/jobs/:id` gives the author and team owner the private job result. Both POSTs need an `Idempotency-Key`.

The program pins SHA-256 values for the reviewed Solidity fixture and Foundry test, permits only those two variants, and allows four runs per server session. If the source bytes change, program submissions and execution fail closed until a reviewed revision updates the pins. Claims, jobs, quota, and idempotency state disappear on restart. The eight external bounty catalog entries remain references to owner programs; public source code does not authorize Auditor intake.

Build the trusted worker image before running verification jobs:

```powershell
docker build -f infrastructure/docker/foundry-worker.Dockerfile -t auditor-foundry-worker:issue-5 .
```

The product operation `POST /v1/verify-poc` accepts only `{"artifactFormat":"repo-fixture-v1","fixture":"vulnerable"}` or `"patched"`. The internal `POST /v1/scan` remains backward-compatible and accepts only `{"artifactFormat":"repo-fixture-v1","target":"local-vaults"}`; it is not exposed by the web proxy or a product scan page.

Both POST routes require `Authorization: Bearer <token>`, `Content-Type: application/json`, and an `Idempotency-Key` of 8–64 ASCII letters, digits, `_`, or `-`. They return `202` and a job ID. `GET /v1/jobs/:id` with the same authorization returns `queued`, `running`, or `finished` plus the actual result. Reusing a key with the same body returns the same job; reuse with another body returns `409`.

Successful fixture results include trusted Foundry output, exit code, sanitized stderr, financial evidence parsed from unambiguous oracle markers, the private receipt, and a local public digest candidate. Missing/malformed markers yield no financial values. The digest is **not an on-chain anchor**.

The server limits POST requests to five and GET requests to 120 per minute per client IP, bodies to 4 KiB, retained jobs to 16, and execution to one job at a time. State is in memory and resets on restart. Arbitrary source, paths, URLs, and shell commands are rejected. The API can invoke Docker and Slither, so it must remain on a trusted development machine; a publicly hosted production API requires new security and deployment work.

Run `npm run test:api` for request tests. `node apps/api/e2e.mjs` requires Docker and the trusted image to check both real fixture verdicts and receipt hashes. The Next proxy has its own authorization and rejection regression tests under `apps/web/lib/proxy.test.ts`.
