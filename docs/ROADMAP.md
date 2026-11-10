# VeriPoC — implementation roadmap

**Updated:** 2026-11-10  
**Hackathon:** Concordium Trusted Agents / Encode  
**Checkpoint 1:** 2026-11-22 (project, team, idea)  
**Final submission:** 2026-12-09 23:59 UTC (verify details on the competition portal)  
**Repository:** https://github.com/huydo2105/veripoc

## Product thesis — updated decision 2026-11-10
**VeriPoC is exclusively a Proof-of-Concept verification service for bug bounty platforms and smart-contract security teams.** A researcher/agent supplies a claim and executable exploit test; we reproduce under stated conditions in a constrained Foundry worker and return evidence and verdicts. **There is no separate contract scanner product.** Concordium identity and planned evidence hash anchors establish provenance. This section and [PRODUCT_SCOPE.md](PRODUCT_SCOPE.md) supersede older scan-first descriptions below.

## Current state (reconciled 2026-11-10)
- **Completed (#1–#7):** agent identity verification, Foundry and Slither development baseline, deliberately vulnerable/patched vault fixtures, optional Slither adapter, fixed-fixture isolated Foundry worker, private evidence receipts and digest, and loopback-only PoC job API.
- **Next:** #8 PoC verification-only judge console, #12 authenticated agent requests, #10 Testnet evidence anchoring, #9 checkpoint, #19 delivery. See [docs/MILESTONES.md](MILESTONES.md).
- **Slither:** already implemented, retain as OPTIONAL internal helper for reproduction setup. It must NOT be a mandatory verification step, scan dashboard, or separate product.
- **Not yet established:** safe arbitrary third-party PoC execution, production multi-tenant hosted API, completed Concordium verification receipt anchoring, working bounty escrow, MCP or payments.
- **Marketing:** Charge for verified PoC jobs or platform integrations, not for generalized contract scanning. Proposed prices remain unvalidated.

## Tool orchestration and evidence
1. **Compile:** pinned solc, dependencies, source/bytecode hashes, ABI, chain ID, fork block, reproducibility manifest.
2. **Optional internal Slither helper (NOT a gate):** analyze source/ABI/call graphs only where it assists reproduction of a submitted exploit. No scan product.
3. **Validate submitted claim:** scope authorization, PoC artifact and target hashes, expected invariant, execution inputs and reproducibility parameters.
4. **Optional AI (P2):** propose missing exploit preconditions or trusted-harness candidates only when necessary; never the verification oracle.
5. **Core — Foundry/Anvil (P0):** execute trusted invariant harness against snapshot/pinned state, record trace, balances, coverage and seed. Distinguish `reproduced`, `not_reproduced`, `inconclusive`, `tool_error`.
6. **Optional PoC sequence search — fuzzer (P2):** Echidna **or** Medusa first, with existing invariant harness; keep a corpus and minimized counterexamples.
7. **Deferred PoC precondition investigation — targeted symbolic testing (P2):** Mythril on selected bytecode/functions or Halmos on Foundry properties; strict per-job budgets and explicit timeout status.
8. **Verification receipt:** hashes of inputs, artifacts, environment, traces and results; never publish unpatched exploit details.
9. **Concordium:** badge and request authentication, optional hash anchors, escrow with authorized, dispute-aware payout; x402 and ZKP only after core demonstrably works.

## Critical safety rules
- A Foundry test passing is **not mathematical proof** and is not by itself a payout authorization.
- Do **not** try to "secure" hostile Solidity code using regex removal of `vm.*` or `ffi`. Use a fixed trusted harness; execute untrusted submissions with locked-down containers/VMs, CPU/memory/disk/time/pid limits, no credentials, network disabled during evaluation, no host Docker socket, read-only filesystem and controlled input.
- Prefetch fork state separately if the worker is network-isolated; don't claim network-free execution can query a remote fork RPC.
- Enforce authorization and responsible disclosure on submitted targets. Keep vulnerability details private, with only safe hashes on-chain.
- No automatic bounty payout on a boolean `exploited`; require authorized adjudication and replay/double-settlement safeguards.
- Residence/non-membership ZK statements alone **do not prove OFAC compliance**. Do not promise legal compliance from a country-of-residence assertion.
- Run all economic activity on Testnet until contracts have tests, audit/review, and dispute handling.
- Confirm license obligations for bundled/open-source tools (Slither, Echidna, Medusa, Halmos, etc.).
- Current prices ($0.05, $0.50 and 5%) are **hypotheses**, not validated profitability.

## Reprioritized calendar

### Phase 1: Nov 10–15 — foundation and exploit fixtures (completed)
- [x] CIS-8 linked identity and Agent #1067 created
- [x] Public Agent Card committed
- [x] Confirm Agent #1067 registration and metadata identity (Issue #1 closed; see issue evidence)
- [x] Foundry development baseline and optional Slither helper
- [x] Vulnerable and patched ERC-4626 examples with verification harness
- [x] Optional Slither adapter, retained internally only

**Exit:** A trusted PoC can be reproduced or rejected with Foundry; Slither is optional.

### Phase 2: Nov 16–22 — verified exploit + first checkpoint
- [x] Initial private evidence receipt schema and public digest
- [x] Controlled fixed-fixture sandbox with positive/negative verification; arbitrary PoC submission is NOT yet supported
- [x] Initial loopback-only PoC verification API and local inspection console; [ ] judge-facing PoC-only UI (#8)
- [ ] Connect live badge read-only checks and request signing
- [ ] Create/publicize Encode project and submit first checkpoint by Nov 22

**Exit:** A judge can watch a real positive and negative verification run, not just a fabricated log.

### Phase 3: Nov 23–29 — Concordium value and optional deeper engines
- [ ] Rust audit anchoring contract with tests, auth, replay protection
- [ ] Minimal Testnet CCD escrow with manual adjudication and explicit settlement approval
- [ ] MCP adapter for `scan_contract` / `verify_poc`
- [ ] Optional sequence reproduction search or AI hypothesis drafting ONLY after MVP, if it improves PoC verification

**Exit:** One receipt is anchored and one safe Testnet bounty is settled with an authorized decision.

### Phase 4: Nov 30–Dec 9 — demo reliability and submission
- [ ] Integrate UI and backend, continuous tests, links to actual transaction hashes
- [ ] x402 or sponsored transactions **only if SDK/payment flow verified**
- [ ] Optional: Web3ID age/residency presentation, clearly not a sanctions-screening system
- [ ] Optional: targeted Mythril / Halmos analysis; record timeouts and accuracy
- [ ] Documentation, threat model, buyer/API examples, cost benchmarks
- [ ] Encode submission (public repo, <=3-minute demo, CCDExplorer link, mainnet plan) by Dec 9 23:59 UTC

**Exit:** Real PoC verification end-to-end video; all demo claims grounded in live output. No scanner pitch.

## Definition of done and ongoing issue workflow
- Each GitHub issue has acceptance criteria, test/evidence links, and dependencies.
- **Only close when verified** by tests, review, deployed behavior or on-chain proofs; close with completion evidence.
- Work in dependency order. After completing a task **within an active working session**, update the GitHub issue and proceed to the next available task.
- No autonomous/background repository changes occur outside an active ChatGPT session. Future work requires another user interaction or an explicitly scheduled automation.
- Freeze optional additions when checkpoint and end-to-end submission are at risk.

## Primary official resources
- https://www.concordium.com/article/concordium-trusted-agents-hackathon-encode-club
- https://github.com/crytic/slither
- https://github.com/foundry-rs/foundry
- https://github.com/crytic/echidna
- https://github.com/crytic/medusa
- https://github.com/ConsenSysDiligence/mythril
- https://github.com/a16z/halmos
- https://github.com/crytic/properties
