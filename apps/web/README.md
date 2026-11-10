# PoC verification judge console

The buildless, responsive page is served by `apps/api` at `http://127.0.0.1:8787`. It supports the reviewed vulnerable and patched local vault fixtures only. There is no upload, external target, scanner workflow, or simulated result. See [API setup](../api/README.md) for a local token and server command.

1. Start Docker Desktop and build the trusted image: `docker build -f infrastructure/docker/foundry-worker.Dockerfile -t veripoc-foundry-worker:issue-5 .`.
2. Set `VERIPOC_API_TOKEN` as documented by the API and run `npm run api:dev` from the repository root.
3. Open `http://127.0.0.1:8787`, paste the token, select the vulnerable fixture, and press **Verify PoC**. Wait for a real `reproduced` result.
4. Select the patched control and press the same button. The expected honest result is `not_reproduced`. Compare the two job verdicts and receipt digests.
5. Expand private evidence JSON only in an authorized review setting. The copy button writes the full job result to the clipboard; it does not upload or persist it.

The page polls the authenticated API every two seconds while a job is active. It does not store the token in browser storage. The trusted Foundry harness emits measured attacker balances and victim shares after its invariant passes; the worker parses exactly one complete set of markers from the successful execution log. If these markers are absent or malformed, the UI explicitly shows **Not captured**. Expected fixture values on the submission screen are claim/oracle context, not measured output.

The public digest is calculated locally from the private receipt and is **not on-chain**. The Agent Card is served byte-for-byte from `.well-known/agent-card.json`; its registration metadata is a read-only link, not live request authentication. Signed requests and Testnet anchors are separate future issues.

Run `npm run test:web` for UI state and negative tests. `npm run test:api` checks the static card route. The Docker-backed real positive/negative API exercise runs in CI via `node apps/api/e2e.mjs` and may also be run locally when Docker is available.
