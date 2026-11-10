# VeriPoC — Two-Sided Agentic Security Marketplace: Product Blueprint
**Decision date:** 2026-11-10 | **Status:** Product direction / proposed scope, not implemented features
**Authoritative scope:** This document supersedes the previous *PoC-verification-only* commercial positioning. PoC verification remains the core trust layer of a broader two-sided agentic auditing workflow.

## 1. One-sentence thesis
**VeriPoC connects DeFi teams that want smart-contract security reviews with security researchers and their own AI agents; those agents investigate authorized contracts, submit findings and reproducible PoCs, and VeriPoC independently validates evidence and records accountable, tamper-evident results using Concordium.**

Two user entry points, **one verification and evidence backend**. Do not create two disconnected products.

### Why this matters
- DeFi teams cannot simply trust a volume of machine-generated vulnerability reports. They need scoped assessments, actionable validated findings, private disclosure, re-testing of patches and audit trails.
- Human researchers need workflow automation and portable agent clients without losing authorship, proof or access to bounty programs.
- Open-ended AI agents are **hypothesis generators and assistants**, not cryptographic proof or trustworthy adjudicators.
- The product's differentiation is **permissioned collaboration + reproducible exploit verification + registered agent identity + evidence provenance**, not "we invented a better vulnerability scanner" or "AI automatically guarantees security."

## 2. Homepage — EXACTLY two primary choices
Hero: **Verifiable smart-contract security, powered by researchers and AI agents.**
Subhead: **Request an authorized security review—or investigate a program with your own agent. VeriPoC reproduces vulnerability evidence and helps teams triage it with accountable provenance.**

Primary cards/buttons:
1. **I have a smart contract to audit** -> /teams/start
   Helper text: "Create an authorized audit program, define scope and invite researchers or agents."
2. **I want to audit** -> /researchers/start
   Helper text: "Join an authorized program, bring your agent and submit reproducible vulnerability evidence."

No standalone **Contract Scanner** homepage button. "Run Slither" is NOT the product; analyzers are internal tools available to authorized researchers/agents. Do not imply contracts automatically receive a complete human audit.

Secondary: **How verification works**, **Explore demo program**, **View evidence example**.
Header: VeriPoC | How It Works | For Teams | For Researchers | Sign in / Connect agent. Do not imply working wallet/SSO until implemented.

## 3. Personas and outcomes

### A. DeFi team / protocol owner (payer; review sponsor)
Goals:
- Register a project and the authorized contract(s) / repository commit, chain, deployment address, contract scope and rules of engagement.
- Set allowed testing conditions: local fork/block, exclusions, disclosure window, allowed chain/test assets, severity guidelines, spending or run limits.
- Select a **private invited audit** for MVP; public open audit programs are later.
- Invite named researcher(s) and registered agents; optionally post a bounty/reward in a future phase.
- Review received reports, inspect evidence, reproduce a finding, request clarification, and mark decisions such as accepted, needs-review, duplicate, out-of-scope or rejected.
- Track remediation: upload patched implementation / new commit and **re-test the same PoC**; export a signed-off assessment summary.

Team success criterion: "A researcher found a demonstrable exploit; our patch prevents that exploit under the same controlled test."

### B. Security researcher / external AI agent operator (contributor)
Goals:
- View authorized programs / assigned scopes and rules.
- Connect an existing agent via SDK, REST or MCP; use their **own choice of tools and models** (not locked to VeriPoC's AI stack).
- Gather source/ABI/dependencies; generate hypotheses using personal tools (Slither, static analysis, fuzzers, LLMs, symbolic tools, manual review).
- Submit a **structured claim plus a reproducible PoC** and expected invariant; see validation, execution and evidence receipt.
- Iterate on inconclusive results, privately share evidence with the team, track disposition and patch verification.
- Maintain attribution to researcher plus registered agent without publicly exposing exploit details.

Researcher success criterion: "I can use my existing agent and prove my finding with a portable, confidential verification receipt."

### C. VeriPoC verification service (neutral evidence layer)
- Authenticates submitter and checks audit scope + permissions.
- Freezes inputs and versions, executes only allowed test workloads in isolated environment, and emits `reproduced / not_reproduced / inconclusive / tool_error`.
- Produces private evidence and safe digest. Later anchors hashes on Concordium with explicit link to agent identity and process state.
- **Does not** decide general contract safety, severity, originality/duplicate status or bounty payment automatically.

## 4. User journeys and screen specification

### 4.1 Shared home
- Two large CTA cards, side-by-side desktop / stacked mobile
- A 3-step graphic: **Authorize scope -> Agents investigate -> VeriPoC verifies & records**
- One explainer on why a claim != exploit != bounty acceptance
- Preview a sample redacted verification receipt and a real registry reference (only real data)

### 4.2 Team flow (initial product)
1. **Create audit program** (/teams/start): project name, repository + immutable commit or approved address/chain, scope, testnet/fork rules, start/end dates, confidentiality, invitation list, authorized signatures.
2. **Audit workspace** (/teams/programs/:id): Overview, Scope & permissions, Submissions, Evidence, Fix verification, Activity (these can be tabs of one simple page for hackathon).
3. **Finding inbox**: submitted claims with status, severity *reported by researcher* versus team adjudicated severity, reproduction verdict, date, assigned submitter; confidential until disclosure.
4. **Finding detail**: claim, assumptions, immutable target version, approved PoC artifacts, actual Foundry trace/balance deltas, reproduction verdict and private receipt hash. Researcher identity as verified/unverified; buttons Request clarification / Accept for triage / Re-test patch.
5. **Patch verification**: pin patched commit/fixture, rerun identical attack and compare; highlight that “not reproduced” applies only under tested conditions.
6. **Summary for stakeholders**: verified findings, open items, limitations and remaining work; **never label it a comprehensive audit certificate** based on a single test.

### 4.3 Researcher flow (initial product)
1. **Researcher portal** (/researchers/start): explain authorization; choose assigned/allowed program, connect researcher identity or demo persona.
2. **Program detail**: scope, test constraints, file/repo version, allowed tools, submission requirements.
3. **Agent workspace**: Connect own AI agent (MCP/REST, initially displayed as Planned where unavailable); show sample CLI/API request and authenticated connection status once Issue #12/#13 done.
4. **Submit finding**: claim title, vulnerability category, steps, target version, expected failed invariant, executable PoC artifact hash and environment manifest; local MVP only selects reviewed vault fixture IDs — do NOT offer unsafe arbitrary code upload.
5. **Verification job**: queued/running/finished, evidence and verdict. An agent may use Slither or other tools for discovery **outside** this proof engine. One normalized endpoint for submit and check.
6. **Findings history**: personal submission status and team feedback, with privacy boundaries.

### 4.4 Reviewer/administrator view (minimum)
- Prevent duplicate submissions/runs, set authorized program and role, gate private reports; handle abuse and manual overrides with audit log.
- Separate `verification verdict` from `team triage decision` and `payout decision`.

## 5. Data model (proposal)
- `Organization`: id, owner identities and permissions.
- `AuditProgram`: id, ownerOrgId, name, scope and authorization attestation, allowed assets/contracts, pinned repo SHA / chain/block, confidentiality, invitations, run budgets, status.
- `ProgramMember`: programId, researcherId/agentId, role, invitation and permission scope.
- `AgentIdentity`: operatorId, CIS-8004 identifier, CIS-8 public-key binding, versioned metadata state, signature verification status.
- `Submission`: id, programId, authorId, agentId optional, claim, vulnerability type, expected effect, original source/commit/bytecode hash, PoC artifact hash, preconditions, confidentiality flag.
- `VerificationJob`: id, submissionId, approved runner and trusted oracle, image digest, compiler, chain/fork block, seed, timeout/resource limits, status, timestamps.
- `VerificationResult`: jobId, verdict, invariant checks, observed financial deltas, traces and error class; `not_reproduced` never means "safe".
- `PrivateReceipt`: schemaVersion, full evidence/provenance digest and confidentiality controls; `PublicAnchor`: only safe receipt hash, no leak of exploit or target vulnerabilities.
- `TriageDecision`: submissionId, reviewerId, duplicate/out-of-scope/accepted/needs-more-info, manual severity, rationale and timestamps.
- `Remediation`: original submission + patched target version + rerun job, before/after comparison.
- `Reward`: **future** escrow amount/asset, authorized adjudication, dispute and settlement states; not tied directly to Foundry's boolean verdict.

### API surface (design, not existing endpoints)
Existing loopback-only prototype: `POST /v1/verify-poc`, `GET /v1/jobs/:id` for reviewed vault fixtures; `POST /v1/scan` remains internal.
New **proposed** operations:
- `POST /v1/programs`, `GET /v1/programs/:id`, `POST /v1/programs/:id/invitations`
- `POST /v1/programs/:id/submissions`, `GET /v1/programs/:id/submissions`
- `POST /v1/submissions/:id/verify`, `GET /v1/jobs/:id`, `GET /v1/jobs/:id/evidence`
- `POST /v1/submissions/:id/triage`, `POST /v1/submissions/:id/retest`
- Agent-compatible MCP: `get_program_scope`, `submit_finding`, `verify_poc`, `get_job_status` (only after actual implementation).
Prefer smallest secure API consistent with this model; do NOT implement all endpoints immediately.

## 6. AI-agent architecture and tool policy
**Agents are external, bring-your-own.** A researcher may use Codex, Claude, local LLMs, or their own automation, and can choose tools. VeriPoC should provide a stable agent-facing interface and verifiable execution results, **not require a centrally hosted auditing LLM**.

Tool roles:
- **Foundry/Anvil**: mandatory deterministic reproduction of a submitted PoC; already implemented for fixed local fixtures.
- **Slither**: optional discovery/triage aid used by researcher-owned agents or as private internal assistant; existing adapter is reused, but NOT a dedicated scanning product or a required PoC gate.
- **Echidna/Medusa**: optional sequence/precondition exploration when a researcher's PoC cannot reproduce.
- **Mythril/Halmos**: deferred targeted reasoning, not a requirement for judges.
- **LLM**: claim summaries, test proposal and remediation hints; never verifier, never trusted to invent balances, severity or evidence.
- **Concordium CIS-8/CIS-8004**: agent identity and key ownership verification, request authorization. Registered identity ≠ competence/trustworthiness.
- **Concordium anchoring**: integrity/time-linked audit evidence commitment, not truth of findings.
- **Escrow**: later phase, with approval/dispute/replay controls; no automatic reward release on `reproduced`.

## 7. Permission, security, privacy and trust model
- Every program needs authorization from its owner. Researcher agents can test only explicit allowed targets and environments. NO external contract probing on mainnet as part of demo.
- Role-based access: team owner, reviewer, invited researcher, researcher agent, system operator. Report visibility is program-scoped; unpatched exploits must not leak through public logs, on-chain transaction metadata or Github Issues.
- AI agents/tools are untrusted clients. Verify signed request with domain/nonce/expiry/key binding, rate limits, per-program budgets, submission ownership, and authorization.
- A Foundry harness should evaluate **pre-registered trusted security invariants** rather than blindly trusting attacker's self-reported success; random arbitrary `forge test` execution from uploads without isolation is unacceptable.
- Sandbox must have immutable image, no host Docker socket, no secrets, network restrictions, read-only filesystem and bounded CPU/memory/time/pids; secure arbitrary submissions require separate hardening.
- Deterministic test pass ≠ generalized smart contract audit ≠ claim originality ≠ automatic bounty eligibility.
- On-chain public metadata must contain only non-sensitive hashes; consider correlation/privacy risks even when the plaintext is omitted.
- Team submission decisions and escrow settlement require human decision with clear audit log and dispute process.

## 8. Business model
**Who pays:** primary B2B payer is DeFi team or bug bounty platform, not researchers. Researcher onboarding should be free or sponsored for early network growth.

Suggested models to test (not validated pricing):
1. Per verified submission/run, with fair-use limits for retries, plus compute-heavy add-ons.
2. Per-program workspace subscription including review seats and a monthly verification allowance.
3. API volume contract with existing bug bounty platforms for independent evidence triage.
4. Later: optional escrow settlement/service fee. **Do not make transaction fees the product's only revenue.**

Important economics: researcher incentives and bot spam controls, review cost, container resource cost, false-positive/noise rate, duplication, and who has authority to approve payouts. Need measured actual costs before pricing claims.

## 9. Honest hackathon MVP cut — Dec 9, 2026
**MVP goal:** demonstrate BOTH entry points with ONE authenticated demo program and ONE real verification pipeline.

MUST DEMONSTRATE:
- Homepage with **I have a smart contract to audit** and **I want to audit**; distinct role onboarding.
- Team creates/selects an *authorized demo audit program* for synthetic vault; scope and trusted fixture manifest visible. Program can be seeded locally; persistent multi-user SaaS is not necessary for the demo.
- Researcher/agent selects the same program, submits the checked-in exploit claim and approved fixture PoC, runs actual Foundry isolated worker.
- Team sees the resulting private finding/receipt and the difference between `reproduced` and `not_reproduced` after applying patched fixture.
- Live or replayable chain-backed agent identity proof, at least one real Concordium Testnet **verification receipt anchor** if Issue #10 is completed; otherwise make pending label explicit and avoid saying it is complete.
- GitHub Actions tests, negative-case results, reproducibility manifest, privacy warnings, and a clean demo video.

MVP MAY **mock only non-security plumbing**, explicitly labeled: program creation may be an in-memory demo program, invited researcher can be seeded, and a simple role switcher may replace real org SSO. Never mock verification results/transactions while claiming they're live.
MVP DOES NOT require: automated discovery of unknown bugs, arbitrary public contract upload, unrestricted external agent execution, marketplace matching, multi-agent orchestration, payouts, real money or auditor-issued audit certificates.

### Demo story (<= 3 minutes)
0:00–0:25 **Home**: Two buttons: “I have a smart contract to audit” / “I want to audit”.
0:25–0:55 **Team**: Create/open the *Demo Vault Audit Program*, inspect authorized scope and invitation.
0:55–1:20 **Researcher**: Open same program, agent identity context, submit a share-inflation claim plus the approved PoC.
1:20–2:05 **VeriPoC**: Run real vulnerable fixture; show reproduced verdict with attacker and victim delta. Re-test patched fixture; show not reproduced. Distinguish test result from severity adjudication.
2:05–2:40 **Evidence + Concordium**: Compare private receipt and public digest; view real Testnet transaction for hash anchor only if it exists.
2:40–3:00 **Team triage / business**: Show finding arrives in owner inbox; owner marks needs review/accepted *manually*; explain pay-per-verification API and researcher-owned agents.

### Product demo differentiation
**Teams initiate a scoped audit; researchers bring any agent; VeriPoC validates actual PoCs and preserves provenance.** Our product is **not** a "push button, fully audited" service.

## 10. Prioritization and milestones
**Completed and preserve:** #1–#8 and #20, including the fixed-fixture PoC console delivered in merged PR #33 with successful CI. Reuse it for both product personas; do not rebuild from scratch.

**M2 (through Nov 22):**
- [x] #8 shared real PoC verification console is complete; build two-persona navigation in separate #34.
- Add a small **Demo Audit Program + role/scope model** (new issue, P0) using strictly predefined local fixtures, no arbitrary uploads or fake permissions.
- #9 checkpoint submission.
- #12 minimum feasible agent identity proof. Signed request verification is needed before production, even if hackathon demo uses registry read-only identity.

**M3 (Nov 23–29):**
- #10 Testnet hash anchoring, #13 researcher/agent MCP/REST flow.
- New **Team finding inbox + retest** issue P0/P1; manual adjudication.
- #11 escrow deferred until both personas and anchoring are integrated.

**M4 (Nov 30–Dec 9):**
- #19 live integrated demonstration, pitch, documentation and supported chains/costs.
- Defer #14–#18 unless core is complete and one concrete use case warrants them.

## 11. Learning checkpoints for founder and judges
At each PR, explain one primary concept: audit program/authorization; researcher agent vs VeriPoC's trusted verifier; sandbox boundary; reproducible PoC verdict; private receipt vs public hash; CIS-8 key binding / CIS-8004 agent record; why manual triage and payment approval remain essential.

## 12. Go / no-go checks
- Can an independent reviewer tell what the researcher claims, what was **actually executed**, and what the trusted invariant measured?
- Can a team see only their authorized private submissions?
- Does the same exploit produce different supported verdicts for vulnerable and patched versions?
- Can a judge verify the agent identifier and at least one anchored digest, if presented as completed?
- Are UI states backed by actual API data, not fabricated?
- Can the product be honestly described as agent-compatible auditing **workflow** rather than a completed autonomous audit service?

**Any claim not yet supported by code, CI, or transaction must be labeled proposed, demo-only, or pending.**
