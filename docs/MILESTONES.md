# VeriPoC milestone timeline

**Updated:** November 10, 2026. **Main deadline:** December 9, 2026, 23:59 UTC.

> This repository currently has four **milestone-tracking issues** (#24–#27), with all 20 pre-existing engineering issues cross-linked to their milestone. Native GitHub milestone objects require running the script below with a GitHub CLI account that can manage milestones.

## Product direction (November 10 pivot)

**Two-sided platform:** DeFi team enters via **I have a smart contract to audit**; researcher/own AI agent enters via **I want to audit**. Both share a scoped authorized audit program and a Foundry PoC verification backend. See [TWO_SIDED_PLATFORM.md](TWO_SIDED_PLATFORM.md). PR #33 (Issue #8) is OPEN, not automatically merged. New tasks are #34, #35, #36.

## Timeline

| Milestone | Dates | Issues | Goal | Gate |
|---|---|---|---|---|
| [M1 — Identity + foundation](../issues/24) | Nov 10–15 | #20, #2, #1, #3, #4 | Identity + Foundry/Slither + vulnerability fixtures | Compilation, tests, verifiable identity |
| [M2 — PoC MVP + Checkpoint 1](../issues/25) | Nov 16–22 | #5, #6, #7, #8, #34, #35, #12, #9 | Isolated worker, evidence, PoC UI, two-role homepage, authorized program, signed agent access; checkpoint | Real vulnerable-vs-patched run and checkpoint |
| [M3 — Concordium + MCP](../issues/26) | Nov 23–29 | #10, #13, #36; optional #11, #14, #15 | Testnet anchors, BYO-agent MCP/REST, team triage/retest; escrow optional | Independently verified on-chain receipt and Testnet flow |
| [M4 — Demo + submission](../issues/27) | Nov 30–Dec 9 | #16, #17, #18, #19 | Reliable demo; stretch tooling if feasible | CI + genuine on-chain links + submission before 23:59 UTC |

### Current progress (reconciled November 10, 2026)

- **M1 COMPLETE**: #20, #2, #1, #3, #4 are closed. Tracking issue #24 closed.
- **M2 IN PROGRESS (3/8)**: #5, #6, #7 are closed with merged PRs; #8 has OPEN PR #33 awaiting owner review; #34, #35, #12, #9 remain open. Milestone tracker #25 is open. Tracking issue #25 remains open.
- **M3 NOT STARTED:** #10, #13, #36 are critical platform/agent/triage work. #11, #14, #15 are optional and remain open.
- **M4 NOT STARTED (0/4)**: #16, #17, #18, #19 remain open; #16–18 are optional stretch goals.
- Latest PR #32 is merged; CI [run 42889270719](https://github.com/huydo2105/veripoc/actions/runs/42889270719) passed Foundry, Slither, and isolated worker jobs. The API from #7 is **loopback-only and restricted to reviewed fixtures**, not a public upload/production service.
- Current next essential work: review PR #33 (#8 PoC UI), then #34 homepage, #35 demo program, #12 signed agent gate, #9 submission; next #10 anchoring, #13 external agent gateway and #36 team triage/retest.
- **Do not confuse closed issue status with a production security guarantee.** The API, sandbox, and receipts have local/CI scope. Native GitHub milestones might still need setup by running the script below.


## Activate native GitHub Milestones

From WSL2 or any terminal with GitHub CLI authenticated for the project repository:

```bash
gh auth login
bash scripts/setup-github-milestones.sh
```

The script is safe to rerun: it checks for existing milestone titles before creating missing ones, then assigns all existing issues to native milestones. It does **not** change their open/closed states. You will then have GitHub's own completion progress indicators and due-date views at:

https://github.com/huydo2105/veripoc/milestones

## Codex review contract
After **each** engineering PR, Codex must stop, link the PR, provide test evidence and a learning checkpoint, and wait for explicit human review before merging or advancing. See [AGENTS.md](../AGENTS.md) and [CODEX_WORKFLOW.md](CODEX_WORKFLOW.md).

The schedule is ambitious. Prioritize genuine end-to-end proof over optional symbolic, payments, and ZKP features. Do not claim that checkboxes alone establish test completion.
