# VeriPoC — implementation roadmap

**Updated:** 2026-11-10  
**Hackathon:** Concordium Trusted Agents / Encode  
**Checkpoint 1:** 2026-11-22 (project, team, idea)  
**Final submission:** 2026-12-09 23:59 UTC (verify details on the competition portal)  
**Repository:** https://github.com/huydo2105/veripoc

## Product thesis
VeriPoC is an **AI-agent identity-gated, reproducible smart-contract security analysis and PoC triage service**. We orchestrate existing tools, rather than invent another analyzer. A **finding** is not equivalent to a **reproduced exploit**, and a reproduced exploit does not establish unique bounty eligibility.

## Current verified and unverified state (do not overclaim)
- **Done:** Concordium Testnet CIS-8 EVM external-key registration: https://ccdexplorer.io/testnet/transaction/bf6b5f40c6918e9b03111921244125c4764f8c4a77c61d0a24dff22b94c20dae
- **Done:** CIS-8004 cross-chain Agent #1067 exists per registry screenshot.
- **Done:** Agent Card JSON published at https://raw.githubusercontent.com/huydo2105/veripoc/main/.well-known/agent-card.json
- **Awaiting verification:** The on-chain `setAgentURI` transaction and active metadata-hash match are not independently established in this repository.
- **Not built:** Production scan service, Foundry worker, Mythril/Echidna, real escrow, MCP, x402, ZKP or operational frontend. An earlier local prototype is **not** deployed/production functionality.
- **Existing repo:** minimal Node package and published Agent Card; avoid calling this a complete monorepo.

## Tool orchestration and evidence
1. **Compile:** pinned solc, dependencies, source/bytecode hashes, ABI, chain ID, fork block, reproducibility manifest.
2. **Gate A — Slither (P0):** JSON/SARIF where feasible, call graph, detectors, source spans, bounded runtime. Only code that is authorized and available.
3. **Normalize:** canonical `finding_id`, tool, rule, severity/confidence, target, location, CWE/SWC when applicable, and provenance; deduplicate, don't overstate.
4. **Gate B — optional AI (P1):** suggest hypotheses, attack preconditions, candidate test harnesses; tool prompts and output are untrusted, no secrets.
5. **Gate C — Foundry/Anvil (P0):** execute trusted invariant harness against snapshot/pinned state, record trace, balances, coverage and seed. Distinguish `reproduced`, `not_reproduced`, `inconclusive`, `tool_error`.
6. **Gate D — fuzzer (P1):** Echidna **or** Medusa first, with existing invariant harness; keep a corpus and minimized counterexamples.
7. **Gate E — targeted symbolic testing (P2):** Mythril on selected bytecode/functions or Halmos on Foundry properties; strict per-job budgets and explicit timeout status.
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

### Phase 1: Nov 10–15 — foundation and first real analysis
- [x] CIS-8 linked identity and Agent #1067 created
- [x] Public Agent Card committed
- [ ] Confirm setAgentURI hash and badge verification on chain (do not mark done without tx/result)
- [ ] Foundry + Slither development baseline, pinned tool versions and fixtures
- [ ] One vulnerable and one fixed ERC-4626 sample and trustworthy invariants
- [ ] Slither adapter emits normalized findings

**Exit:** Developer can run Slither and Foundry locally and see a reproducible result.

### Phase 2: Nov 16–22 — verified exploit + first checkpoint
- [ ] Design reproducible job manifest, evidence receipt schema and deduplication
- [ ] Harden sandbox and run a positive/negative exploit fixture
- [ ] Implement REST verification API and simple UI with visible honest status
- [ ] Connect live badge read-only checks and request signing
- [ ] Create/publicize Encode project and submit first checkpoint by Nov 22

**Exit:** A judge can watch a real positive and negative verification run, not just a fabricated log.

### Phase 3: Nov 23–29 — Concordium value and optional deeper engines
- [ ] Rust audit anchoring contract with tests, auth, replay protection
- [ ] Minimal Testnet CCD escrow with manual adjudication and explicit settlement approval
- [ ] MCP adapter for `scan_contract` / `verify_poc`
- [ ] Add Echidna or Medusa and AI hypothesis/test generation behind feature flags

**Exit:** One receipt is anchored and one safe Testnet bounty is settled with an authorized decision.

### Phase 4: Nov 30–Dec 9 — demo reliability and submission
- [ ] Integrate UI and backend, continuous tests, links to actual transaction hashes
- [ ] x402 or sponsored transactions **only if SDK/payment flow verified**
- [ ] Optional: Web3ID age/residency presentation, clearly not a sanctions-screening system
- [ ] Optional: targeted Mythril / Halmos analysis; record timeouts and accuracy
- [ ] Documentation, threat model, buyer/API examples, cost benchmarks
- [ ] Encode submission (public repo, <=3-minute demo, CCDExplorer link, mainnet plan) by Dec 9 23:59 UTC

**Exit:** Real end-to-end video; all demo claims grounded in live output.

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
