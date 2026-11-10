# VeriPoC — Roadmap: two-sided AI-agent security auditing
**Updated:** 2026-11-10 | **Encode Checkpoint 1:** 2026-11-22 | **Final submission:** 2026-12-09 23:59 UTC (verify with event portal)
**Source of truth:** [TWO_SIDED_PLATFORM.md](TWO_SIDED_PLATFORM.md) | [PRODUCT_SCOPE.md](PRODUCT_SCOPE.md) | [MILESTONES.md](MILESTONES.md)

## Vision
VeriPoC is a **two-sided, AI-agent-compatible security audit collaboration platform**:
- **I have a smart contract to audit** — DeFi teams create authorized programs, invite researchers/agents, triage confidential reports and validate patches.
- **I want to audit** — researchers use their own AI agents and preferred security tools, submit vulnerability claims and PoCs, and receive reproducible evidence.

**Technical trust core:** an independent, constrained Foundry PoC verifier, private evidence receipts and Concordium agent identity / planned on-chain hash anchoring. AI-generated claims are hypotheses; execution evidence is measured under specified conditions; team acceptance and payout are separate human decisions.

The product does **not** provide a complete push-button autonomous audit, a separate general-purpose contract scanner, or automatic bounty eligibility.

## Current audited implementation status — as of November 10
- **DONE #20, #1–#7:** CIS-8/CIS-8004 agent identity/metadata verification, foundational Foundry + Slither toolchain, synthetic vulnerable and patched ERC-4626 vaults, optional Slither analysis adapter, isolated fixed-fixture worker, private/public receipt digest, and loopback-only Node verification API.
- **OPEN PR #33 for #8:** the PoC verification judge console has been proposed and must be **reviewed by the owner**; do not merge automatically. Both role flows will reuse this verification screen.
- **NOT YET DONE:** dual-persona homepage and program authorization model (#34–#35), actual team finding inbox and patch retest (#36), API agent signing (#12), Concordium Testnet evidence anchoring (#10), researcher MCP tools (#13), public hosted ingestion of arbitrary contracts or PoCs, and payouts.

## Demonstrable user journeys
### DeFi team
Home -> **I have a smart contract to audit** -> Create/select authorized Audit Program -> pin contract/commit + scope -> invite researcher/agent -> receive private finding -> inspect real reproducible PoC verdict -> request clarification/mark accepted manually -> upload patched fixture -> re-test exploit.

### Security researcher / BYO agent
Home -> **I want to audit** -> Select allowed Audit Program -> read scope and rules -> research manually / via own Codex/Claude/custom agent with optional Slither, fuzzing or LLM tools -> submit structured claim + executable PoC -> VeriPoC runs trusted Foundry worker -> receive private evidence and status -> await team triage.

### Shared verification flow
Authorized submission + pinned execution inputs -> validation/permissions -> isolated trusted Foundry test -> `reproduced`, `not_reproduced`, `inconclusive` or `tool_error` -> private evidence + safe SHA-256 digest -> proposed Concordium Testnet anchor -> human triage. A successful test never automatically triggers a bounty payment.

## Tool policy
| Tool/capability | Why / when | MVP status |
|---|---|---|
| Foundry/Anvil | deterministic PoC reproduction & trusted invariants | CORE; fixed-fixture worker implemented |
| Slither | researcher/agent's optional candidate discovery and source investigation, optional internal support | existing adapter; no separate scanner product/UI |
| Own AI agent | researcher-controlled investigation and PoC generation via REST/MCP | agent gateway planned; do not require any vendor |
| Echidna/Medusa | optional sequence exploration for difficult PoCs | stretch; #14 |
| LLM hypothesis generation | optional draft assistance, never verification oracle | stretch; #15 |
| Mythril/Halmos | targeted investigation when justified | deferred #16 |
| Concordium CIS-8/CIS-8004 | identify accountable agent and bind signed requests | registry existing; request signatures #12 |
| Concordium hash anchor | verifiable, privacy-preserving evidence commitment | P0 #10 |
| Escrow/x402/ZKP | business extensions, not the central demo | defer #11, #17–#18 |

## Detailed schedule and issue gates
### M1 — Foundation, Nov 10–15 — **COMPLETE**
#20, #1, #2, #3, #4. Complete identity, Foundry baseline, synthetic exploit/patch, optional Slither adapter. Existing tests and code must remain intact. [Tracking #24](https://github.com/huydo2105/veripoc/issues/24).

### M2 — Two-sided MVP and Encode Checkpoint, Nov 16–22
- [x] #5 controlled Foundry worker
- [x] #6 confidential verification receipt and safe digest
- [x] #7 loopback-only fixed-fixture verification API
- [ ] #8 review/open PR #33 for **real-data PoC verification console**; no auto-merge
- [ ] **#34** two homepage buttons and persona-specific views (reuse #8 console)
- [ ] **#35** demo authorized audit program, scope checks, invited researcher role
- [ ] #9 Encode checkpoint submission with honest architecture/progress
- [ ] #12 agent signed authentication — desirable in M2, carry into early M3 if necessary

**Exit:** In the same demo program, a DeFi team can review a vulnerability claim from an authorized researcher and watch real vulnerable/patched Foundry verification. The role switcher/program may be pre-seeded, but no security data or verdict is faked. [Tracking #25](https://github.com/huydo2105/veripoc/issues/25).

### M3 — Trust, researcher agents and team triage, Nov 23–29
- [ ] **#10** actual Concordium Testnet evidence hash anchor with explorer proof
- [ ] **#13** BYO-agent REST/MCP integration using the shared PoC backend
- [ ] **#36** private team finding inbox, manual triage and same-PoC patched retest
- [ ] #12 complete signed CIS-8 / CIS-8004 request gate if not finished in M2
- [ ] #11 escrow **optional** only if safely adjudicated and no threat to demo
- [ ] #14 / #15 **defer** unless hard evidence shows benefit

**Exit:** A researcher or their agent submits evidence to an authorized program, owner sees private result and re-tests patch; at least one real receipt digest is checkable on Concordium Testnet. [Tracking #26](https://github.com/huydo2105/veripoc/issues/26).

### M4 — Integration, proof and submission, Nov 30–Dec 9
- [ ] #19 final product demo, readme, risk/limitations, CI, architecture, screenshots and submission
- [ ] Finalize a 3-minute dual-persona walkthrough with real constrained-vault exploit and patched counterexample
- [ ] Verify actual identity and receipt on Concordium explorer; no fabricated receipt or chain link
- [ ] Trial pricing as **per verification job or per audit program / platform API**, never claim validated economics before measurement
- [ ] #16–#18 optional only if demo is fully reliable; no automatic bounty payout

**Exit:** Judges can distinguish role-specific user flows, real PoC verification, independent evidence provenance and clear unimplemented production boundaries. [Tracking #27](https://github.com/huydo2105/veripoc/issues/27).

## Judge demo (<=3 min)
1. **0:00–0:25** Home: two buttons. What team and researcher need.
2. **0:25–0:55** Team: Demo Vault Audit Program; scoped, authorized fixture and invitation.
3. **0:55–1:20** Researcher: own AI-agent integration pathway, submit share-inflation PoC.
4. **1:20–2:05** Run Foundry: vulnerable case reproduced (observable attacker/victim delta), patched case not reproduced.
5. **2:05–2:40** Confidential evidence, digest, Concordium identity and actual receipt anchor only if implemented.
6. **2:40–3:00** Team finding inbox and manual decision; B2B pay-per-verification model.

## Security and product honesty
- No generalized permission to audit unrelated third-party contracts. Audit programs require explicit authorization and scoped environments.
- Treat researcher agents, submitted code, compiled contracts and PoCs as hostile. Current runner supports ONLY predefined trusted fixtures. Public arbitrary uploads need separate isolation, validation and resource budgets.
- Never expose unpatched exploit traces publicly/on-chain; hashes only, with privacy-conscious metadata.
- Slither static findings and LLM text are NOT exploit proofs.
- A Foundry pass proves a **particular tested outcome**, not general contract safety or a legally binding audit certification.
- Reproduced verdict ≠ accepted bounty; duplicates, scope, severity and payout are adjudicated by humans.
- On-chain anchor attests evidence digest/provenance, not intrinsic correctness.
- Never describe proposed features as deployed or show simulated outcomes as live.

## Codex execution discipline
Read AGENTS.md. **One issue -> branch -> tests -> educational PR -> STOP for human review.** Do not merge #33 or begin a new issue until owner explicitly approves, even if roadmap priorities change. Update tasks and milestone trackers with genuine verified evidence. Avoid a giant rewrite or rebuilding existing working code.

## Official source links
- https://www.concordium.com/article/concordium-trusted-agents-hackathon-encode-club
- https://github.com/foundry-rs/foundry
- https://github.com/crytic/slither
- https://github.com/crytic/echidna
- https://github.com/crytic/medusa
