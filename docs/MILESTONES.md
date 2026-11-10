# VeriPoC milestone timeline

**Updated:** November 10, 2026. **Main deadline:** December 9, 2026, 23:59 UTC.

> This repository currently has four **milestone-tracking issues** (#24–#27), with all 20 pre-existing engineering issues cross-linked to their milestone. Native GitHub milestone objects require running the script below with a GitHub CLI account that can manage milestones.

## Timeline

| Milestone | Dates | Issues | Goal | Gate |
|---|---|---|---|---|
| [M1 — Identity + foundation](../issues/24) | Nov 10–15 | #20, #2, #1, #3, #4 | Identity + Foundry/Slither + vulnerability fixtures | Compilation, tests, verifiable identity |
| [M2 — PoC MVP + Checkpoint 1](../issues/25) | Nov 16–22 | #5, #6, #7, #8, #12, #9 | Isolated worker, receipt, API, UI, signed agent access; checkpoint | Real vulnerable-vs-patched run and checkpoint |
| [M3 — Concordium + MCP](../issues/26) | Nov 23–29 | #10, #11, #13, #14, #15 | Testnet audit anchors, authorized escrow, agent tools, extensions | Independently verified on-chain receipt and Testnet flow |
| [M4 — Demo + submission](../issues/27) | Nov 30–Dec 9 | #16, #17, #18, #19 | Reliable demo; stretch tooling if feasible | CI + genuine on-chain links + submission before 23:59 UTC |

### Current progress
- Completed: #20 (registered identity and public card), #2 (merged Foundry + Slither baseline with passing CI).
- Outstanding: #1 verification of metadata anchor; #3 onward implementation tasks.
- The **four milestone tracking issues are open**; each contains a checkbox list and definition of done. They summarize work but do **not** bypass PR-by-PR review.
- Issues #14–18 include enhancements or stretch goals. MVP can be ready without all stretch features, as specified in docs/ROADMAP.md.

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
