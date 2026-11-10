# Codex delivery playbook: two-sided VeriPoC MVP

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

> Read AGENTS.md, docs/TWO_SIDED_PLATFORM.md, docs/PRODUCT_SCOPE.md, docs/ROADMAP.md, docs/CODEX_WORKFLOW.md. Product has TWO main buttons: "I have a smart contract to audit" and "I want to audit". PR #33 for #8 is MERGED with successful CI, and #8 is CLOSED. Reuse its working shared PoC verification console. STOP until I explicitly authorize beginning #34; when approved, implement the two-role homepage and guided onboarding, following the one-issue-one-PR-review-STOP protocol. Then #35 program scopes, #12 agent auth, #10 anchor, #13 MCP agent integration, #36 team inbox/retest as approved. Never claim unrestricted arbitrary smart-contract uploads or a full autonomous audit.


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

**Completed and retained:** #1–#7, #20: fixtures, optional Slither adapter, isolated Foundry worker, receipts and local API. #8 is complete: PR #33 merged with green CI. Keep the existing verifier intact. Begin #34 only after a separate explicit request from the owner.

**New two-sided P0 work:** #34 homepage with two role buttons; #35 explicit authorized program / researcher role / scoped fixture; #9 checkpoint; #12 CIS-8/CIS-8004 signed request gate. Two audiences use the same verification infrastructure and private evidence, not separate products.

**High-value M3:** #10 real Concordium Testnet evidence anchoring; #13 bring-your-own-agent REST/MCP for researcher; #36 team finding inbox / manual triage / patched retest. #11 bounty escrow is optional behind authorized settlement controls.

**Stretch:** #14–#18 only if measurable value and core flows are complete. Slither, fuzzers and external LLMs may help researcher agents discover potential flaws but are not required in the VeriPoC trusted reproduction pipeline.

**Product source:** docs/TWO_SIDED_PLATFORM.md and docs/PRODUCT_SCOPE.md. Every PR must document which persona it helps, which audit-program permissions are enforced, and how it strengthens the judge story.

## Teaching syllabus for pitch and project management

| Work area | Owner should be able to explain to judges | Operational decision |
| --- | --- | --- |
| ERC-4626 fixture | share inflation/invariant and why patched contract resists | What vulnerability means under realistic assumptions |
| Two-sided programs | sponsor scope and invite-based permission; researcher-owned agents | Who can submit to which audit program? |
| External researcher agents | investigator proposes, trusted verifier executes | How is researcher autonomy preserved without untrusted PoC execution? |
| Optional Slither helper | static observations do not reproduce an exploit | Only use if it helps prepare or understand a PoC |
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
1. Homepage with **two main actions** and an authorized demo program shared by team and invited researcher. Researcher submits reviewed vulnerable and patched vault PoC.
2. Real Foundry PoC reproduction against vulnerable and patched fixture with constrained resources; Slither analysis is optional internal supporting information, NOT a required judge UI screen.
3. Distinguishable reproduced / not reproduced / inconclusive verdicts with trace/evidence hash.
4. Team sees an authorized researcher's private submission, reviewer sees real UI/API outcome; signed agent auth live where implemented, otherwise clearly marked as pending.
5. One finalized Concordium Testnet hash anchor with independently verifiable chain transaction; if unavailable, demo must mark anchoring pending, not fake it.
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
