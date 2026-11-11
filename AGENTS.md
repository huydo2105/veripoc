# Instructions for coding agents working in VeriPoC

This file governs all Codex work in this monorepo. Read it **before** making changes, together with `docs/TWO_SIDED_PLATFORM.md`, `docs/PRODUCT_SCOPE.md`, `docs/ROADMAP.md` and `docs/CODEX_WORKFLOW.md`.

## Mission
Deliver a **working and truthfully demonstrated VeriPoC MVP**: a **two-sided AI-agent security collaboration platform**: DeFi teams create authorized audit programs; independent researchers bring their own AI agents, submit claims and PoCs; a controlled Foundry worker checks reproduction under specified conditions, producing confidential evidence and future Concordium hash commitments. Never claim that a test passing is a mathematical proof or automatically qualifies a bounty payout.

## Non-negotiable human-in-the-loop protocol
1. **One issue, one branch, one PR.** Completed issues #1–#7 are preserved. **Issue #8 is completed: PR #33 has merged with green CI, and Issue #8 is closed.** Next proposed engineering task is #34 (two-role homepage), followed by #35 scoped audit program, #9 checkpoint, #12 signed agent access, #10 anchoring, #13 BYO-agent gateway and #36 team triage. Start #34 only on explicit user authorization; preserve the one-PR-at-a-time gate. follow dependencies in `docs/ROADMAP.md`. The issue list is prioritized, not strictly numeric: do not implement all P2 options if the MVP is at risk.
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
- **One two-sided product with TWO home buttons**: `I have a smart contract to audit` (team) and `I want to audit` (researcher). Both enter the same program-scoped finding + PoC verification workflow. Read `docs/TWO_SIDED_PLATFORM.md` and `docs/PRODUCT_SCOPE.md`.
- Researchers may bring **their own AI agents and tools** for authorized vulnerability investigation. VeriPoC is the neutral program, permission, verification and evidence infrastructure. Foundry/Anvil is core; Slither is an optional support/agent tool, NOT a standalone scan subscription or required PoC gate. Do not claim an AI agent automatically performs a comprehensive audit.
- Fuzzing, symbolic execution, platform-provided AI suggestions, x402 and ZKP are optional. Basic REST/MCP **bring-your-own-agent** integration is a high-priority product workflow, but never at the expense of proven execution/authorization.
- Pin compiler, dependency and fork versions in experiments; record environment, seed, input artifact hashes, and verifiable results.
- Run only authorized audit-program targets. Separate protocol owner/team, invited researcher/agent, and trusted verifier roles. Do not expose private program reports, unpublished PoCs, keys, wallet credentials or privileged RPC endpoints.
- Untrusted Solidity, test harnesses, and scripts belong in a hardened isolated worker; regex screening is NOT sandboxing. Treat AI output as untrusted.
- Verification verdicts: `reproduced`, `not_reproduced`, `inconclusive`, `tool_error`. Successful reproduction alone never authorizes escrow payout; adjudication and dispute/replay rules apply.
- Preserve `.well-known/agent-card.json` bytes unless separately authorized to update on-chain hash references.
- Never assert legal OFAC/sanctions compliance from residence-only ZK statements.
- Never deploy to mainnet, publish a new vulnerability, or transfer real funds without explicit human authorization.

## MVP completion gate
MVP is only complete after: (a) two-button homepage and distinct DeFi team/researcher journeys against the same **authorized demo program**, (b) real vulnerable-vs-patched Foundry test and private evidence, (c) appropriate scoped identity/permission controls or clearly labeled non-production demo role switcher, (d) Concordium Testnet evidence anchor with verifiable transaction, and (e) recorded end-to-end judge demonstration with genuine results. Preserve existing Slither CI, but it is not a product gate. Never claim unrestricted arbitrary submissions are safe. See roadmap for stretch goals.

## Approved frontend direction (2026-11-11)
- The owner requests a **Next.js App Router + TypeScript + Tailwind CSS** frontend after the open #34 / PR #37 is reviewed; see `docs/FRONTEND_ARCHITECTURE.md` and Issue #38.
- Use the **icon-only VeriPoC vector mark** (available on PR #37) in the header and app icon. No visible text logo/letter-V placeholder; keep accessible name for the home link.
- Issue #39 adds an accessible interactive and scroll-assisted **Authorize → Investigate → Verify** explanation. See `docs/INTERACTIVE_LANDING.md`.
- Do not merge PR #37 automatically or start Issue #38 before the owner's explicit approval. Migration must not change trusted Foundry worker, receipt hashes or API auth contracts.
