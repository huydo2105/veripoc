# VeriPoC product scope — PoC verification only
**Decision:** 2026-11-10. **Single commercial product:** executable smart-contract Proof-of-Concept verification for bug bounty platforms and protocol security teams.

## One-sentence value proposition
VeriPoC receives an authorized vulnerability claim and executable PoC, reproduces it in a controlled EVM environment, and returns an evidence-backed verification verdict. Concordium provides registered agent identity and, once implemented, tamper-evident hash anchoring.

## In-scope product experience
1. **Verify PoC** — the ONLY primary entry point. Submit structured claim, program authorization, target chain/address and pinned block or local fixture, PoC/test artifact, expected attack outcome, trusted invariant specification. The current API permits ONLY hardcoded reviewed fixtures. Arbitrary uploads are NOT yet available.
2. **Input preflight** — reject out-of-scope or untrusted formats; compile/pin dependencies and environment; bind submission and authenticated agent/organization.
3. **Foundry/Anvil execution** — run reproducible exploit against controlled fixture/snapshot or pre-fetched fork in a strongly isolated worker with a trusted verification oracle.
4. **Verdict** — `reproduced`, `not_reproduced`, `inconclusive`, `tool_error`; include tested preconditions, trace, balance/invariant deltas, compiler/version/seed/fork context.
5. **Evidence receipt** — confidential evidence hash, result provenance, and only a safe digest for publication.
6. **Concordium** — verify submitted agent via CIS-8/CIS-8004, anchor receipt digest on Testnet when supported; do not claim hash anchoring is already implemented.
7. **Share results privately** — REST and optionally MCP integration for bounty triage / security teams. No bounty eligibility or severity adjudication is automated by a reproduced result.

## NOT a product
- No general smart-contract scanner UI, contract health scores, static finding dashboards, vulnerability discovery subscriptions, or scan-first workflows.
- No mandatory Slither scan or LLM inference before every PoC. Preserve existing Slither code as an **optional offline analysis helper** only for reproduction prerequisites, source/ABI investigation, or explanation, when it provides concrete value.
- Do not add Mythril, Echidna, Medusa, or Halmos simply for integration count. Their use requires an actual reproducibility case with measurable value.
- No claims of automated discovery, mathematical proof, independently verified severity, automatic bounty eligibility, production-grade remote upload, or completed legal compliance.
- No automatic payout on test success; escrow is separate and requires authorized approval and dispute protections.

## Judge demonstration — 3 minutes
1. **0:00–0:25:** A bounty platform receives a claim that a vault share-inflation exploit steals a victim's deposit.
2. **0:25–0:55:** Show agent identity and submitted PoC information, plus pinned environment. If live badge auth isn't ready, label it as a registry read-only proof, not signed API authentication.
3. **0:55–1:45:** Press **Verify PoC**, run controlled vulnerable vault, show Foundry `reproduced`, attacker before/after balances and victim shares.
4. **1:45–2:10:** Run exactly the same attack against patched vault, show `not_reproduced` under tested conditions.
5. **2:10–2:40:** Show private receipt digest and agent identity; show finalized Concordium Testnet hash anchor ONLY if Issue #10 is complete. Otherwise present it as the next milestone.
6. **2:40–3:00:** Show proposed bounty platform API integration and charge-per-verification business model. Existing local API is NOT a production partner integration.

## Architecture and API direction
- Canonical operation `POST /v1/verify-poc`; `GET /v1/jobs/:id` and private evidence fetch; existing `POST /v1/scan` is internal/backward-compatible and should not appear as a product CTA.
- REST / MCP should use the SAME PoC validation and verification backend.
- Keep human-reviewed and signed trust boundaries; no Docker socket, uncontrolled network/host access, or customer secrets inside execution containers.
- Preserve current working fixture-based verification, test suites, Slither adapter and CI. Scope change does not mean deleting useful code or altering the published on-chain Agent Card without re-hashing.
- Price per **verification job** or platform tier, not per static scan; validate costs/accuracy before claiming rates.

## Priorities and next issues
- Completed and preserve: #1–#7, #20 (identity, fixture, optional Slither helper, sandbox, receipts and local API).
- **P0 #8:** judge-facing **PoC verification-only** UI: submission, run, comparison, evidence, identity. No scan tab/dashboard.
- **P0 #12:** actual CIS-8/CIS-8004 request identity gate.
- **P0 #10:** Concordium Testnet evidence hash anchoring.
- **P0 #9, #19:** hackathon checkpoint and final delivery.
- **P1 #13:** MCP `verify_poc` / `get_job_status`; do not require `scan_contract` as a product operation.
- **P1 #11:** Testnet escrow only after authorized settlement safeguards and core integration.
- **Defer #14, #15, #16, #17, #18** unless there is time and a concrete PoC reproduction use case.

## Product decision rule for any additional analyzer
Only integrate a tool when all are true:
1. It materially increases successful PoC **reproduction**, validity of evidence, or robustness of the verification workflow.
2. It has an explicit test fixture and benchmark vs Foundry-only baseline.
3. It fits the release deadline without harming the end-to-end demo.
4. It doesn't introduce unmitigated security/privacy/execution risks.
