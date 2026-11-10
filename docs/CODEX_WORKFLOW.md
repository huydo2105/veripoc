# Codex delivery playbook: issue #3 through hackathon MVP

## Purpose
Codex should implement as many MVP tasks as requested, **but only ONE PR at a time**. This is an intentionally human-gated process, not an unattended autonomous sprint. The agent cannot receive an answer while the project owner is away; work resumes when the owner explicitly responds and re-invokes Codex.

## Start
On Windows use WSL2 Ubuntu when practical, with Git, Foundry, Slither, Node, Docker and Codex installed. In the repository:

```bash
cd ~/veripoc
git switch main
git pull --ff-only
codex
```

Paste the following into Codex as the project instruction:

> Read AGENTS.md, docs/ROADMAP.md, docs/CODEX_WORKFLOW.md, and GitHub Issue #3. Implement Issue #3 on a new feature branch, using the existing Foundry + Slither baseline, with passing tests, honest evidence, and an educational PR description using .github/pull_request_template.md. Open the PR and STOP. Do not merge, close the issue, or work on Issue #4 until I have reviewed this PR, answered the comprehension questions, and explicitly authorized the next step. For subsequent tasks, apply the same PR-by-PR stop-and-teach protocol; independently check dependency order and MVP priority, rather than blindly following issue numbers.

## At each pull request
**Codex output to the user:**
- PR URL, linked issue, branch and one-sentence purpose;
- what it implemented and files worth reviewing;
- exact CI run link and green/red/pending status (not inferred);
- two or three concepts to learn to run the project;
- two or three comprehension questions and suggested files/commands to answer;
- concrete judge/demo evidence and what remains unfinished;
- the explicit sentence: **'I have stopped. Please review this PR and ask questions; I will not merge or begin the next issue without your approval.'**

**User review protocol:**
1. Read PR overview and changes, especially affected trust boundaries.
2. Ask Codex to explain confusing lines, run a trace, or teach core ideas.
3. Answer the comprehension questions in your own words; ask Codex to correct mistakes.
4. Review GitHub Actions and negative/security tests.
5. Explicitly request: **'I approve PR #N. Recheck CI and merge it; close Issue #M with evidence. Then stop and show me the next issue's learning objectives.'**
6. Give separate authorization: **'Start Issue #K, one PR only. Stop for my review.'**

The agent should not confuse 'green tests' with safety guarantees. If CI is unavailable, the PR stays open.

## MVP prioritization, not an unconditional issue-number march
**First core reproducibility:** #3 vulnerable + patched ERC-4626, #4 Slither adapter, #5 isolated worker, #6 evidence/receipt, #7 API, #8 live UI. #12 authentic agent gate should be integrated when API is ready. The identity metadata confirmation is #1 and remains a separate prerequisite.

**Concordium demonstrable value:** #10 real hash audit anchoring and #11 controlled **Testnet** escrow once safeguards and APIs are ready. #13 MCP interface is highly desirable for an AI-agent hackathon. #9 checkpoint and #19 final deliverable are non-optional date gates.

**Time-budgeted enhancements:** #14 Echidna or Medusa and #15 AI hypothesis generation can improve the product; #16 Mythril/Halmos, #17 x402, and #18 Web3ID ZKP are stretch features. Do not let stretch features prevent an end-to-end real demonstration.

## Teaching syllabus for pitch and project management

| Work area | Owner should be able to explain to judges | Operational decision |
| --- | --- | --- |
| ERC-4626 fixture | share inflation/invariant and why patched contract resists | What vulnerability means under realistic assumptions |
| Slither | static finding vs false positive | How to prioritize reports |
| Foundry/Anvil | deterministic reproduction and pinned fork | When is a result inconclusive? |
| Isolated worker | hostile code, trust boundary, limits | Why regex sanitizing is insufficient |
| Receipt & hashes | integrity, provenance and privacy | What goes on-chain vs stays confidential |
| REST/MCP | identity, auth, idempotency, workflow | Who pays and who can submit |
| CIS-8/CIS-8004 | identity registration vs proof-of-control | Can a badge be spoofed? |
| Concordium anchors | tamper evidence not proof of correctness | Why Concordium is essential to the product |
| Escrow | adjudication, dispute, payout safety | Why not auto-pay on a test pass |
| Pitch | live happy path and negative path, costs, roadmap | Demonstrate a genuine customer benefit |

## What 'done' means
A real MVP demonstration should show:
1. Submitted authorized vulnerable vault and patched control.
2. Real Slither static report and Foundry invariant test running with constrained resources.
3. Distinguishable reproduced / not reproduced / inconclusive verdicts with trace/evidence hash.
4. Agent request authenticated where supported, real UI/API result, no fabricated logs.
5. One finalized Concordium Testnet hash anchor with independently verifiable chain transaction.
6. A private reproducible artifact and safe public demo, including limitations.
7. GitHub Actions green on the checked-in code and a short reproducible judge video.

**At each PR and at MVP freeze, update the pitch facts from live evidence.** Never claim that CIS-8004 registration proves security competence, a proof-of-concept is a mathematical proof, or a residence-only ZKP verifies sanctions compliance.

## Safe continuation prompts
After understanding a PR:

> I have reviewed and understand PR #N. Recheck all required tests and CI, merge it if green, close Issue #M with verification evidence, then STOP. Explain the next issue's technical and pitch learning goals.

After merge and closure:

> Begin Issue #K only. Make one PR and stop for my review. Teach me the concepts I need to understand the change, manage VeriPoC, and present the new feature to judges.

## Deadline behavior
If time is short, freeze nice-to-have features. Prefer correctness and demonstrated integration over breadth. Do not represent a prototype as audited or production secure.
