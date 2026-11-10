# Instructions for coding agents working in VeriPoC

This file governs all Codex work in this monorepo. Read it **before** making changes, together with `docs/ROADMAP.md` and `docs/CODEX_WORKFLOW.md`.

## Mission
Deliver a **working and truthfully demonstrated VeriPoC MVP**: a multi-engine security triage service where a deterministic test proves or fails to reproduce a deliberately introduced EVM vulnerability, with agent identity and tamper-evident Concordium evidence. Never claim that a test passing is a mathematical proof or automatically qualifies a bounty payout.

## Non-negotiable human-in-the-loop protocol
1. **One issue, one branch, one PR.** Start with [Issue #3](https://github.com/huydo2105/veripoc/issues/3); follow dependencies in `docs/ROADMAP.md`. The issue list is prioritized, not strictly numeric: do not implement all P2 options if the MVP is at risk.
2. Read the entire issue and its acceptance criteria before coding. Confirm branch is based on up-to-date `main`. Name branch `feat/issue-<number>-<short-slug>`.
3. Implement and test only that issue; include negative tests and security controls when relevant. Never fake test output, code review, transactions, or deployment.
4. Open **one PR** with the standard repository PR template fully completed, including a practical learning review, security tradeoffs, and pitch evidence. Link the issue but do not use GitHub auto-close keywords in the PR until acceptance is actually confirmed.
5. **STOP IMMEDIATELY after opening the PR.** Give the human the PR URL, CI status (or 'pending/unverified'), key files, test output, a concise lesson and 2–3 comprehension questions. **Do not merge, close the issue, start another issue, or push more changes** unless the human specifically requests a revision or explicitly approves the PR. The human must have time to read, understand, and ask questions.
6. After human approval, recheck the latest head SHA, CI results, code review and security concerns. Merge **only when explicitly instructed** and checks pass. Update/close the issue with actual evidence, then again **STOP** and request separate permission to begin the next task. A generic request made at the start of the project is **not** blanket approval to merge or advance.
7. If blocked, explain the blocker, attempted remediation and safe next steps. Never replace missing evidence with invented successes.

## Teaching and pitch requirements — mandatory in every PR
Include:
- **What changed and why:** architecture context and dependency flow;
- **Learn it:** 3–6 paragraphs of technical explanation suitable for a technical founder, with definitions of novel tools and security assumptions;
- **Must understand:** 2–3 review questions and their expected answers in a collapsed `<details>` section;
- **Threat model:** what is trusted, attacker capabilities, what is NOT guaranteed;
- **Demo/Pitch:** what can be honestly shown to judges now, with live command or result, and one concise 15–30 second pitch statement;
- **Evidence:** actual commands, reproducible test outputs, logs or CI URLs, and limitations. Never fabricate benchmark timings, exploit impact, or revenue.

## Engineering principles
- Single repo `huydo2105/veripoc`; evolve gradually into apps/, packages/, contracts/, workers/, infrastructure/.
- Prefer Slither + Foundry/Anvil for MVP; fuzzing, symbolic execution, paid MCP, and ZKP are progressively gated.
- Pin compiler, dependency and fork versions in experiments; record environment, seed, input artifact hashes, and verifiable results.
- Run only authorized test targets. Do not expose unpublished PoCs, keys, wallet credentials or privileged RPC endpoints.
- Untrusted Solidity, test harnesses, and scripts belong in a hardened isolated worker; regex screening is NOT sandboxing. Treat AI output as untrusted.
- Verification verdicts: `reproduced`, `not_reproduced`, `inconclusive`, `tool_error`. Successful reproduction alone never authorizes escrow payout; adjudication and dispute/replay rules apply.
- Preserve `.well-known/agent-card.json` bytes unless separately authorized to update on-chain hash references.
- Never assert legal OFAC/sanctions compliance from residence-only ZK statements.
- Never deploy to mainnet, publish a new vulnerability, or transfer real funds without explicit human authorization.

## MVP completion gate
MVP is only complete after: reproducible vulnerable-vs-patched fixture; passing Foundry test and Slither job; authenticated verification API; isolated worker; user-facing actual results; Concordium Testnet evidence anchor with verifiable transaction; recorded end-to-end judge demonstration. See roadmap for stretch goals.
