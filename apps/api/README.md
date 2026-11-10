# Local verification API

Issue #7 exposes the reviewed repository fixtures through a loopback-only Node API. It is a developer and judge demo interface, not a public upload service. Node 20+ is required.

From the repository root, set a fresh token of at least 32 characters and start the server:

```powershell
$tokenBytes = New-Object byte[] 32
$rng = [Security.Cryptography.RandomNumberGenerator]::Create()
$rng.GetBytes($tokenBytes)
$rng.Dispose()
$env:VERIPOC_API_TOKEN = ([BitConverter]::ToString($tokenBytes)).Replace('-', '').ToLower()
npm run api:dev
```

Open `http://127.0.0.1:8787` and paste the token into the local page. The token is held in page memory, sent only to the same-origin loopback API, and lost on reload. Do not expose this server through a proxy or public interface.

`POST /v1/scan` accepts exactly `{"artifactFormat":"repo-fixture-v1","target":"local-vaults"}`. It invokes the pinned local Slither adapter and requires the Slither toolchain. `POST /v1/verify-poc` accepts exactly `{"artifactFormat":"repo-fixture-v1","fixture":"vulnerable"}` or `"patched"`; build the trusted worker image first:

```powershell
docker build -f infrastructure/docker/foundry-worker.Dockerfile -t veripoc-foundry-worker:issue-5 .
```

Both POST routes require `Authorization: Bearer <token>`, `Content-Type: application/json`, and a unique `Idempotency-Key` of 8–64 ASCII letters, digits, `_`, or `-`. They return `202` and a job ID. `GET /v1/jobs/:id` with the same authorization returns `queued`, `running`, or `finished` plus the result. A repeated key with the same body returns the same job; reuse with another body returns `409`.

The server limits POST requests to five and GET requests to 120 per minute per client IP, bodies to 4 KiB, retained jobs to 16, and execution to one job at a time. State is in memory and resets on restart. Only fixed fixtures run; arbitrary source, paths, URLs, and shell commands are rejected. The API process can invoke Docker and Slither and therefore must run only on a trusted development machine. It does not submit an anchor to Concordium or issue a badge.

Run request tests with `npm run test:api`. `node apps/api/e2e.mjs` requires the trusted Docker image and checks both actual fixture verdicts and receipt hashes.
