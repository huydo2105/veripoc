# VeriPoC web app

The homepage explains Authorize, Investigate, and Verify in three scroll sections and shows local fixture numbers. The navbar links to a dedicated `/leaderboard` page backed by `public/data/agent-leaderboard.json`. Its profiles have zero verified findings and are illustrative, not actual users or rankings. `/how-it-works` explains the researcher workflow from the vault instructions. `/opportunities/demo-vault` shows public fixture details and links to the authorized program workspace. The vault offers no bounty reward. The direct `/verify` operator route remains available.

The App Router also serves `/get-started` and the team program form at `/teams/new`; `/workflow` redirects to Get started. The old `/teams/start` and `/researchers/start` pages were removed. The opportunity directory has one row of category filters and shows eight published Immunefi bug bounties, ten read-only public source references from `public/data/public-sources.json`, active public VeriPoC scope records, and one runnable local EVM vault fixture. Bounty detail pages provide Instructions, Scope, and Prior audits tabs. Their Join bounty actions open `/submit-report?bounty=<id>` in the same four-step researcher wizard layout as the vault: review scope, brief an agent, draft the finding, and review for official submission. This draft stays in browser memory. It does not create membership, send a private report, or run an external PoC. Unknown bounty IDs return 404 and never fall back to the local verifier. Source links point to official GitHub repositories at pinned commits. External bounty and source cards cannot submit to the VeriPoC verifier. A team account can publish a scope record from the team form; its profile has **Our projects** and **Our findings** pages. New programs do not yet have report intake or arbitrary PoC execution. Future support for authorized external targets and untrusted agent-generated PoCs is tracked separately in Issue #43.

The site has Paper and Charcoal themes. The switch stores only a display preference in local storage; tokens, evidence, and project drafts are never saved there. Opportunity filters and program tabs do not execute Foundry. The verifier remains the Client Component that performs actual authenticated job submission and polling.

The public vault detail links to `/programs/demo-vault` and `/submit-report`, which share the same four-step Demo Vault audit wizard layout (`01 Review scope`, `02 Brief your agent`, `03 Draft the finding`, `04 Verify evidence`). In Step 4, enter the invited researcher or team token configured on the API server. The API returns the role, scope, and private submissions; the invited researcher submits the reviewed claim through `/v1/programs/demo-vault/submissions` and runs vulnerable and patched fixture jobs. The team opens the protected program view in Step 4 to inspect those submitted claims and their private receipts. The page keeps tokens and private evidence in memory only (never in URLs or browser storage). The existing `/verify` operator console remains for compatibility, and the eight external bounty flows (`/submit-report?bounty=<id>`) remain unsent drafts. There is no full inbox, triage decision, external bounty intake, production account, or browser-based agent signing. Optional signed direct API access is documented in [the API README](../api/README.md).

## Local setup

Use Node 22.13+ and npm. From the repository root:

```powershell
npm ci
npm run web:dev
```

Open `http://127.0.0.1:3000`. The public pages work without the API. The `bug-bounties.json` catalog is a manually checked snapshot, not a live API feed; recheck status and rules before using it. The Next server proxies the fixed-fixture routes and the explicit `/v1/programs/demo-vault` scope, submission, and job routes to `VERIPOC_API_ORIGIN` (default `http://127.0.0.1:8787` in development). Start the API separately for a real verification:

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

Enter the operator token in `/verify`, or a program role token in Step 4 of `/programs/demo-vault` or `/submit-report`. It stays in page memory and is lost on reload. The browser sends it to the same-origin proxy, which forwards it to the API; the token is never bundled into client JavaScript, saved to browser storage, or put into a URL. The proxy allows only explicit routes. The API enforces its bearer tokens, membership, idempotency, fixture validation, rate limits, and job limits. Public program cards and external bounty drafts grant no access.

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

The published Agent Card is copied byte-for-byte into `public/.well-known/agent-card.json` for the web origin. Optional signed direct API requests are available only for explicitly invited Testnet agents; browser signing and evidence anchoring are not implemented. A reproduced result applies only to the tested fixture and environment.
