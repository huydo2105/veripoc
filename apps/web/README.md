# VeriPoC web app

The homepage explains Authorize, Investigate, and Verify in three scroll sections and shows local fixture numbers. The navbar links to a dedicated `/leaderboard` page backed by `public/data/agent-leaderboard.json`. Its profiles have zero verified findings and are illustrative, not actual users or rankings. `/how-it-works` explains the researcher workflow from the vault instructions. `/opportunities/demo-vault` reads the reviewed fixture program details from `public/data/vault-program.json` and provides Instructions and Scope tabs. Its Join bounty link opens `/submit-report`, where the existing authenticated verifier runs the supported local fixtures; it does not enroll a researcher in a live bounty. The direct `/verify` route remains available.

The App Router also serves `/get-started` and the unsaved team preview at `/teams/new`; `/workflow` redirects to Get started. The old `/teams/start` and `/researchers/start` pages were removed. The opportunity directory shows one runnable local vault fixture and two unavailable layout previews. The team draft does not create or publish a program.

The site has Paper and Charcoal themes. The switch stores only a display preference in local storage; tokens, evidence, and project drafts are never saved there. Opportunity filters and program tabs do not execute Foundry. The verifier remains the Client Component that performs actual authenticated job submission and polling.

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

Enter the token in `/verify`. It stays in page memory and is lost on reload. The browser sends it to the same-origin proxy, which forwards it to the API; the token is never bundled into client JavaScript, saved to browser storage, or put into a URL. The proxy allows only the two verification endpoints. The API still enforces its bearer token, idempotency, fixed-fixture validation, rate limits, and job limits. The UI does not grant team/researcher permissions; the program cards and draft are illustrative while scoped permissions are pending in Issue #35.

For a deployment with a separate backend, configure `VERIPOC_API_ORIGIN` as a **server-only HTTPS origin**. Production builds reject HTTP, credentials, paths, queries, and fragments. The current API binds only to loopback, so a remote deployment additionally needs a secured, private API hosting arrangement; this issue does not create one. Do not expose the Docker-capable Node process directly to the internet. The Next server does not run Foundry or Docker.

## Checks

```powershell
npm run test:web
npm run web:typecheck
npm run web:lint
npm run web:build
npm run test:e2e --workspace @veripoc/web
```

Playwright checks 1440, 1024, 390, and 320 pixel layouts, the vertical homepage story, opportunity-to-detail navigation, category/search behavior, unsaved draft behavior, source-code selection, theme persistence, keyboard focus, desktop scroll, no-JavaScript fallback, and the no-backend error state. It uses installed Chrome locally and downloads Chromium in CI. Set `CAPTURE_SCREENSHOTS=1` for local screenshots in the Playwright test output. For real positive/negative fixture execution, run `node apps/api/e2e.mjs` after building the Docker image; that exercise is also in CI.

The published Agent Card is copied byte-for-byte into `public/.well-known/agent-card.json` for the web origin. Concordium request signing and evidence anchoring are planned work. A reproduced result applies only to the tested fixture and environment.
