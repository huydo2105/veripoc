# VeriPoC product scope — Two-sided, AI-agent-compatible security auditing

**Decision:** November 10, 2026. This document **supersedes** the previous PoC-verification-only product strategy while **retaining independent PoC reproduction as the technical and evidentiary core**.

Read the comprehensive canonical specification: [TWO_SIDED_PLATFORM.md](TWO_SIDED_PLATFORM.md).

## One product, two user entry points
1. **I have a smart contract to audit** — a DeFi team creates/opens an authorized audit program, defines scope and permissible environments, invites researchers/agents, receives confidential findings, reviews evidence, and retests patches.
2. **I want to audit** — a security researcher uses their own agent and tools (or manual expertise) on explicitly authorized programs, submits a vulnerability claim and executable PoC, and receives independently reproducible verification evidence.

These are **two roles in one security collaboration platform**, not two separate scanning/verification products.

## What VeriPoC owns
- Authorized program scope, invited researcher/agent participation, permissions and private disclosure lifecycle.
- Single PoC verification pipeline using trusted Foundry/Anvil invariant tests with a strongly isolated worker.
- Unambiguous verdicts: reproduced, not_reproduced, inconclusive, tool_error, never automatically "contract safe" or "bounty approved".
- Private evidence receipts and safe public commitment hashes, Concordium CIS-8/CIS-8004 identity, and future Testnet evidence anchoring.
- Shared API/MCP gateway so researcher-owned external agents can interact without lock-in.

## What researcher-owned agents own
- Security investigation, candidate vulnerability discovery, optional tool orchestration, PoC development and submission subject to program authorization. Their tools may include Slither, Foundry, fuzzers, custom scripts or LLMs.
- The platform **must not** require Slither, an internal LLM, or a particular agent vendor. Existing Slither code is a useful optional adapter, NOT a separate contract scanner product.

## MVP frontend
Homepage has exactly two primary buttons:
- **I have a smart contract to audit** -> DeFi team program view.
- **I want to audit** -> researcher/agent program view.

Both converge on **Submit finding -> Verify PoC -> Evidence -> Team review -> Patch retest**.
No standalone scanner homepage, general audit score or unqualified "fully audited by AI" badge.

## Genuine current state vs proposed
**Completed:** #1–#7 and #20: registered agent, local fixtures, optional Slither adapter, restricted isolated worker, receipt digest and loopback-only verification API.
**Existing PR awaiting owner review:** #33 (Issue #8) builds the PoC console; do not auto-merge. It may be reused for both roles.
**Next:** #34 two-role homepage, #35 program/permission model, #36 team triage and patch retest; #12 request signatures, #10 Concordium Testnet anchors, #13 agent MCP gateway. See [ROADMAP.md](ROADMAP.md).
**Not yet working:** arbitrary customer contract upload, generic arbitrary PoC execution, trusted multi-tenant hosted service, complete AI-automated audit, real B2B partner integration, reward escrow and verifiable receipt anchoring.

## Boundaries
- A researcher can submit to a specific *authorized* program; unpatched findings, source and traces stay private.
- All incoming agents, tests and executable artifacts are untrusted. Keep strong sandbox isolation and trusted invariants.
- On-chain hashes show evidence integrity/provenance, not audit correctness or severity.
- Human review determines severity, acceptance, duplicates and reward decisions; never auto-pay for a successful PoC.
- Pricing: DeFi team / bounty platform pays per verification or audit workspace/API access; unverified unit economics are hypotheses.

## Tool-adoption decision
Only add a security tool when it measurably improves **the researcher-to-verified-finding workflow**, passes a comparison fixture, fits the deadline, and preserves isolation/privacy.
