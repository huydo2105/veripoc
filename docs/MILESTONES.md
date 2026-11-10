# VeriPoC — Two-Sided Platform Milestones and GitHub Project
**Reconciled:** November 10, 2026 | **Final deadline:** December 9, 2026, 23:59 UTC (verify the hackathon portal)

## Product
**DeFi team:** "I have a smart contract to audit." **Security researcher:** "I want to audit." The two roles share one explicitly authorized audit program, bring-your-own-agent investigation, and a trusted isolated Foundry PoC verifier. Source: [TWO_SIDED_PLATFORM.md](TWO_SIDED_PLATFORM.md).

## Milestone schedule (core versus optional)
| Milestone / tracking issue | Dates | Core issues | Optional issues | Verified status |
|---|---|---|---|---|
| [M1 — Foundation](../issues/24) | Nov 10–15 | #20, #1, #2, #3, #4 | — | **5/5 done, tracker closed** |
| [M2 — Two-Sided MVP & Checkpoint](../issues/25) | Nov 16–22 | #5, #6, #7, #8, #34, #35, #12, #9 | — | **4/8 done, 4 open** |
| [M3 — BYO Agents, Concordium & Triage](../issues/26) | Nov 23–29 | #10, #13, #36 | #11, #14, #15 | **0/3 core done** |
| [M4 — Demo & Submission](../issues/27) | Nov 30–Dec 9 | #19 | #16, #17, #18 | **0/1 core done** |

**Note:** #12 is assigned to M2; if it slips it is an early M3 carry-over, not silently done. Optional items stay open/unscheduled unless individually approved.

## Current engineering evidence
- #1–#8 and #20 are closed. PR #33 for #8 has **merged**, commit `ff1dbb5e3be69c1f72ed8e3fce25301fe591b00d`. [CI run 42899822745](https://github.com/huydo2105/veripoc/actions/runs/42899822745) completed successfully, with passing Foundry, Slither and isolated worker jobs.
- This is a **local fixed-fixture PoC console**, not yet a two-sided production application and not permission for arbitrary third-party uploads.
- Next: #34 two-role homepage, #35 scoped demo program, #9 checkpoint, #12 signed request auth. Then #10 on-chain evidence, #13 external researcher-agent interface, and #36 private inbox/patch retest.
- No new unfinished feature should be labeled completed merely because UI placeholder exists.

## GitHub synchronization
The connected GitHub issue editor can maintain the **tracking issues** above but cannot directly configure **native GitHub Milestones** or **GitHub Projects v2 fields/views**. An idempotent CLI script is checked into the repository for an authorized GitHub account:

```bash
cd ~/veripoc
git switch main && git pull --ff-only
gh auth login
gh auth refresh -s project
python3 scripts/sync-github-planning.py
```

The script:
1. Creates/updates four native GitHub Milestones (reuses previous titles to avoid duplicates), with accurate due dates, and assigns all **23 engineering issues** without changing their open/closed status.
2. Creates or reuses one VeriPoC GitHub Project, adds all 23 engineering issues without duplicates, sets planned **Start date** and **Target date** fields on dated core work, and sets completed items to **Done** where the project has a matching status option.
3. Leaves optional/stretch work without a fabricated schedule. It preserves existing issue state and existing unrelated projects.

**View after running:** [Native milestones](https://github.com/huydo2105/veripoc/milestones) · [User Projects](https://github.com/users/huydo2105/projects).

For the timeline matching a Gantt chart, open the Project and create a **Roadmap** view (new view -> Roadmap); use **Start date** and **Target date** as date fields. Also keep Table and Board views for issue tracking. Project view creation may require this one browser action.

**Dry-run:** `python3 scripts/sync-github-planning.py --dry-run`. **Only native milestones:** `bash scripts/setup-github-milestones.sh`. Running the script does **not** merge any PRs, close issues, or publish exploits.

## Codex human review gate
One issue, one branch, one PR; after opening the PR, stop for the owner's learning, review and explicit approval. Separate approval is required to begin the next issue. Source: [AGENTS.md](../AGENTS.md).
