# Local verification API

The Node API is a separate loopback-only service at `http://127.0.0.1:8787`. The Next.js web app runs separately at `http://127.0.0.1:3000` and forwards only its supported verification requests. See [web setup](../web/README.md). The API no longer serves the public HTML pages. It still serves its original Agent Card bytes at `GET /.well-known/agent-card.json`.

Set a fresh token of at least 32 characters and start from the repository root:

```powershell
$tokenBytes = New-Object byte[] 32
$rng = [Security.Cryptography.RandomNumberGenerator]::Create()
$rng.GetBytes($tokenBytes)
$rng.Dispose()
$env:VERIPOC_API_TOKEN = ([BitConverter]::ToString($tokenBytes)).Replace('-', '').ToLower()
npm run api:dev
```

Build the trusted worker image before running verification jobs:

```powershell
docker build -f infrastructure/docker/foundry-worker.Dockerfile -t veripoc-foundry-worker:issue-5 .
```

The product operation `POST /v1/verify-poc` accepts only `{"artifactFormat":"repo-fixture-v1","fixture":"vulnerable"}` or `"patched"`. The internal `POST /v1/scan` remains backward-compatible and accepts only `{"artifactFormat":"repo-fixture-v1","target":"local-vaults"}`; it is not exposed by the web proxy or a product scan page.

Both POST routes require `Authorization: Bearer <token>`, `Content-Type: application/json`, and an `Idempotency-Key` of 8–64 ASCII letters, digits, `_`, or `-`. They return `202` and a job ID. `GET /v1/jobs/:id` with the same authorization returns `queued`, `running`, or `finished` plus the actual result. Reusing a key with the same body returns the same job; reuse with another body returns `409`.

Successful fixture results include trusted Foundry output, exit code, sanitized stderr, financial evidence parsed from unambiguous oracle markers, the private receipt, and a local public digest candidate. Missing/malformed markers yield no financial values. The digest is **not an on-chain anchor**.

The server limits POST requests to five and GET requests to 120 per minute per client IP, bodies to 4 KiB, retained jobs to 16, and execution to one job at a time. State is in memory and resets on restart. Arbitrary source, paths, URLs, and shell commands are rejected. The API can invoke Docker and Slither, so it must remain on a trusted development machine; a publicly hosted production API requires new security and deployment work.

Run `npm run test:api` for request tests. `node apps/api/e2e.mjs` requires Docker and the trusted image to check both real fixture verdicts and receipt hashes. The Next proxy has its own authorization and rejection regression tests under `apps/web/lib/proxy.test.ts`.
