# VeriPoC web app

The four public routes are Next.js App Router pages: `/`, `/teams/start`, `/researchers/start`, and `/verify`. The first three are Server Components. The verifier is an interactive Client Component and uses the same job parser as the previous console. Both roles lead to the same verification route.

## Local setup

Use Node 22.13+ and npm. From the repository root:

```powershell
npm ci
npm run web:dev
```

Open `http://127.0.0.1:3000`. The public pages work without the API. The Next server proxies only `POST /v1/verify-poc` and `GET /v1/jobs/:id` to `VERIPOC_API_ORIGIN` (default `http://127.0.0.1:8787` in development). Start the API separately for a real verification:

```powershell
$tokenBytes = New-Object byte[] 32
$rng = [Security.Cryptography.RandomNumberGenerator]::Create()
$rng.GetBytes($tokenBytes)
$rng.Dispose()
$env:VERIPOC_API_TOKEN = ([BitConverter]::ToString($tokenBytes)).Replace('-', '').ToLower()
npm run api:dev
```

Build the trusted Docker image first if you want the vulnerable/patched Foundry results:

```powershell
docker build -f infrastructure/docker/foundry-worker.Dockerfile -t veripoc-foundry-worker:issue-5 .
```

Enter the token in `/verify`. It stays in page memory and is lost on reload. The browser sends it to the same-origin proxy, which forwards it to the API; the token is never bundled into client JavaScript, saved to browser storage, or put into a URL. The proxy allows only the two verification endpoints. The API still enforces its bearer token, idempotency, fixed-fixture validation, rate limits, and job limits. The UI does not grant team/researcher permissions; the demo program remains illustrative until Issue #35.

For a deployment with a separate backend, configure `VERIPOC_API_ORIGIN` as a **server-only HTTPS origin**. Production builds reject HTTP, credentials, paths, queries, and fragments. The current API binds only to loopback, so a remote deployment additionally needs a secured, private API hosting arrangement; this issue does not create one. Do not expose the Docker-capable Node process directly to the internet. The Next server does not run Foundry or Docker.

## Checks

```powershell
npm run test:web
npm run web:typecheck
npm run web:lint
npm run web:build
npm run test:e2e --workspace @veripoc/web
```

Playwright checks 1440, 1024, 390, and 320 pixel layouts, navigation, keyboard focus, and the no-backend error state. It uses installed Chrome locally and downloads Chromium in CI. Set `CAPTURE_SCREENSHOTS=1` for local screenshots in the Playwright test output. For real positive/negative fixture execution, run `node apps/api/e2e.mjs` after building the Docker image; that exercise is also in CI.

The published Agent Card is copied byte-for-byte into `public/.well-known/agent-card.json` for the web origin. Concordium request signing and evidence anchoring are planned work, not features of this frontend migration. A reproduced result applies only to the tested fixture and environment.
