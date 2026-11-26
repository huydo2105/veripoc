"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Bot, Check, Clipboard, FileCode2, FileText, LockKeyhole, ShieldCheck } from "lucide-react";
import { ProgramConsole, type ProgramSubmission } from "@/components/programs/program-console";
import type { Job } from "@/lib/types";
import program from "@/public/data/vault-program.json";
import { FIXTURES, VERDICTS } from "@/state.mjs";

type Draft = { title: string; location: string; cause: string; impact: string; invariant: string; reproduction: string; tools: string };
type DraftKey = keyof Draft;

const emptyDraft: Draft = { title: "", location: "", cause: "", impact: "", invariant: "", reproduction: "", tools: "" };
const targetSha256 = "0151b8d3c7e0dfa8cb1851f4663761e06c4e676c50df31b0acd1baf4acfa1eb1";

const fields: { key: DraftKey; label: string; hint: string; long?: boolean; required?: boolean }[] = [
  { key: "title", label: "Claim title", hint: "e.g. Donation before deposit can zero victim shares", required: true },
  { key: "location", label: "Affected code location", hint: "Contract, function, and source revision", required: true },
  { key: "cause", label: "Root cause and preconditions", hint: "What state and transaction order make the claim possible?", long: true, required: true },
  { key: "impact", label: "Observed or expected impact", hint: "Distinguish a hypothesis from an observed result.", long: true, required: true },
  { key: "invariant", label: "Security invariant", hint: "What property should the contract preserve?", long: true, required: true },
  { key: "reproduction", label: "Reproduction steps and PoC reference", hint: "List exact steps, fixture, and trusted test reference.", long: true, required: true },
  { key: "tools", label: "Agent and tools used", hint: "Your agent or local tools", required: false },
];

const stages = [
  { title: "Review scope", icon: FileCode2 },
  { title: "Brief your agent", icon: Bot },
  { title: "Draft the finding", icon: FileText },
  { title: "Verify evidence", icon: ShieldCheck },
] as const;

const agentBrief = `Auditor researcher brief — reviewed local vault fixture

Authorization boundary: Investigate only contracts/evm/FixtureVault.sol (SHA-256 ${targetSha256}) and the checked-in trusted test at test/TrustedVaultWorker.t.sol. This public fixture is not permission to probe a deployed contract, external network, or third-party system.

Goal: Review donation-driven share inflation in the ERC-4626-style vault. Compare VulnerableVault with PatchedVault. Focus on share accounting, deposit ordering, rounding, attacker and victim balances, and the invariant that a victim deposit should not mint zero shares after a donation.

Use your own model and tools locally. Treat generated observations as hypotheses. Return a private report with: claim title; affected source location and root cause; preconditions; impact; expected invariant; exact reproduction steps; and PoC/test reference. Never invent a Foundry verdict, balance, receipt, or bounty decision.

Auditor accepts the reviewed donation-share-inflation claim (with optional structured report) and vulnerable/patched fixture references in Step 4 or via the local signed REST/MCP agent gateway (packages/agent-gateway/mcp-server.mjs) for invited agents. Arbitrary PoC uploads and external bounty intake remain planned, not available here.`;

function describeFindingStatus(submittedClaim: ProgramSubmission | null, latestJob: Job | null) {
  if (!submittedClaim) {
    return {
      label: "Draft only — not yet submitted",
      detail:
        "This finding is only an unsent draft in page memory. Enter an invited researcher token below to submit the reviewed claim to the Demo Vault program and run Foundry verification, or open the protected program view with the team token.",
    };
  }
  if (latestJob?.state === "finished" && latestJob.result) {
    const verdict = VERDICTS[latestJob.result.status].label;
    return {
      label: `Real worker verdict returned — ${verdict}`,
      detail: `Submitted claim "${submittedClaim.claim}" (submission ${submittedClaim.id}) completed real Foundry execution for ${FIXTURES[latestJob.fixture].name} and returned verdict: ${verdict}.`,
    };
  }
  return {
    label: "Claim submitted — awaiting worker verdict",
    detail: `Reviewed vault claim "${submittedClaim.claim}" (submission ${submittedClaim.id}) has been submitted privately to the Demo Vault program. Run a reviewed fixture or wait for the Foundry worker to finish.`,
  };
}

/** Shared four-step Demo Vault audit wizard used on both /submit-report and /programs/demo-vault. */
export function ReportWizard({ unlockAllSteps = false }: { unlockAllSteps?: boolean }) {
  const [step, setStep] = useState(0);
  const [furthest, setFurthest] = useState(unlockAllSteps ? stages.length - 1 : 0);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [error, setError] = useState("");
  const [copyStatus, setCopyStatus] = useState("");
  const [submittedClaim, setSubmittedClaim] = useState<ProgramSubmission | null>(null);
  const [latestJob, setLatestJob] = useState<Job | null>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const navigated = useRef(false);

  useEffect(() => {
    if (navigated.current) titleRef.current?.focus();
  }, [step]);

  function goTo(next: number) {
    navigated.current = true;
    setError("");
    setStep(next);
    setFurthest(current => Math.max(current, next));
    window.scrollTo({ top: 0, behavior: "auto" });
  }

  function continueFromDraft() {
    const missing = fields.find(field => field.required && !draft[field.key].trim());
    if (missing) {
      setError("Complete the required finding fields, or choose Skip draft to use the reviewed verifier directly.");
      document.getElementById(`report-${missing.key}`)?.focus();
      return;
    }
    goTo(3);
  }

  async function copyBrief() {
    try {
      await navigator.clipboard.writeText(agentBrief);
      setCopyStatus("Agent brief copied. Review it before sharing with your own agent.");
    } catch {
      setCopyStatus("Clipboard unavailable. Select and copy the brief below.");
    }
  }

  const lifecycle = describeFindingStatus(submittedClaim, latestJob);

  return (
    <main id="main" className="site-shell submit-report report-wizard">
      <Link href="/opportunities/demo-vault" className="back-link focus-ring">
        <ArrowLeft size={16} aria-hidden="true" /> Vault program
      </Link>
      <header className="report-wizard-hero">
        <p className="eyebrow">Demo Vault Audit Program</p>
        <h1>
          Turn an agent finding
          <br />
          into evidence.
        </h1>
        <p>
          Review the authorized Demo Vault scope, brief your own agent, prepare a finding draft, then submit and verify the reviewed claim with your program token.
        </p>
      </header>
      <div className="report-wizard-layout">
        <nav className="report-wizard-steps" aria-label="Finding preparation steps">
          <ol>
            {stages.map((stage, index) => {
              const Icon = stage.icon;
              return (
                <li key={stage.title}>
                  <button
                    type="button"
                    className="focus-ring"
                    aria-current={step === index ? "step" : undefined}
                    disabled={!unlockAllSteps && index > furthest}
                    onClick={() => goTo(index)}
                  >
                    <span className="report-step-icon">
                      <Icon size={18} aria-hidden="true" />
                    </span>
                    <span>
                      <small>0{index + 1}</small>
                      {stage.title}
                    </span>
                    {index < step && <Check size={15} aria-hidden="true" />}
                  </button>
                </li>
              );
            })}
          </ol>
        </nav>
        <div className="report-wizard-content">
          {step === 0 && (
            <section className="report-stage" aria-labelledby="report-stage-title">
              <span className="report-stage-kicker">STEP 01 / 04</span>
              <h2 id="report-stage-title" tabIndex={-1} ref={titleRef}>
                Know what you may investigate.
              </h2>
              <p>
                The only runnable program today is the reviewed Demo Vault fixture. Reading this scope does not authorize testing any deployed contract.
              </p>
              <dl className="report-scope-list">
                <div><dt>Target source</dt><dd><code>{program.target}</code></dd></div>
                <div><dt>Target SHA-256</dt><dd><code className="mono-data">{targetSha256}</code></dd></div>
                <div><dt>Trusted PoC</dt><dd><code>{program.poc}</code></dd></div>
                <div><dt>Environment</dt><dd>{program.environment}</dd></div>
                <div><dt>Accepted input</dt><dd>{program.permittedInput}</dd></div>
                <div><dt>Run quota</dt><dd>4 verification runs per server session</dd></div>
              </dl>
              <h3>In scope</h3>
              <ul>{program.inScope.map(item => <li key={item}>{item}</li>)}</ul>
              <h3>Out of scope</h3>
              <ul>{program.outOfScope.map(item => <li key={item}>{item}</li>)}</ul>
              <Link href="/opportunities/demo-vault" className="report-inline-link focus-ring">
                Read full program instructions <ArrowRight size={15} aria-hidden="true" />
              </Link>
              <div className="report-stage-actions">
                <button type="button" className="report-secondary focus-ring" onClick={() => goTo(3)}>
                  Open protected program view
                </button>
                <button type="button" className="site-action site-action-dark focus-ring" onClick={() => goTo(1)}>
                  Continue to agent brief <ArrowRight size={16} aria-hidden="true" />
                </button>
              </div>
            </section>
          )}
          {step === 1 && (
            <section className="report-stage" aria-labelledby="report-stage-title">
              <span className="report-stage-kicker">STEP 02 / 04</span>
              <h2 id="report-stage-title" tabIndex={-1} ref={titleRef}>
                Give your agent a bounded brief.
              </h2>
              <p>
                Run your own agent or use manual tools locally. Ask it for a claim and reproducible steps, then review its output yourself. Auditor does not run an auditing agent for you.
              </p>
              <div className="report-agent-note">
                <Bot size={21} aria-hidden="true" />
                <div>
                  <strong>Bring your own tools</strong>
                  <span>
                    Source review, local Foundry tests, Slither, or fuzzing can help find a candidate issue. None is a verification verdict.
                  </span>
                </div>
              </div>
              <div className="report-brief-header">
                <h3>Copyable agent brief</h3>
                <button type="button" className="report-secondary focus-ring" onClick={() => void copyBrief()}>
                  <Clipboard size={16} aria-hidden="true" /> Copy brief
                </button>
              </div>
              <pre className="report-agent-brief">{agentBrief}</pre>
              <p role="status" aria-live="polite" className="report-copy-status">
                {copyStatus}
              </p>
              <p className="report-small-note">
                A configured local API can verify signed requests from an invited agent. An automated REST/MCP gateway is planned. This brief stays in your browser until you copy it.
              </p>
              <div className="report-stage-actions">
                <button type="button" className="report-secondary focus-ring" onClick={() => goTo(0)}>
                  Back
                </button>
                <button type="button" className="site-action site-action-dark focus-ring" onClick={() => goTo(2)}>
                  Draft a finding <ArrowRight size={16} aria-hidden="true" />
                </button>
              </div>
            </section>
          )}
          {step === 2 && (
            <section className="report-stage" aria-labelledby="report-stage-title">
              <span className="report-stage-kicker">STEP 03 / 04</span>
              <h2 id="report-stage-title" tabIndex={-1} ref={titleRef}>
                Write a reproducible claim.
              </h2>
              <p>
                Turn your agent&apos;s observations into a report a reviewer could investigate. This draft stays in page memory only as an unsent draft until you submit the reviewed claim in Step 4 with an invited researcher token.
              </p>
              <div className="report-fields">
                {fields.map(field => (
                  <div key={field.key}>
                    <label htmlFor={`report-${field.key}`}>
                      {field.label} <span className="report-optional">{field.required ? "*" : "Optional"}</span>
                    </label>
                    {field.long ? (
                      <textarea
                        id={`report-${field.key}`}
                        required={field.required}
                        rows={field.key === "reproduction" ? 4 : 3}
                        value={draft[field.key]}
                        onChange={event => {
                          setDraft(current => ({ ...current, [field.key]: event.target.value }));
                          setError("");
                        }}
                        placeholder={field.hint}
                      />
                    ) : (
                      <input
                        id={`report-${field.key}`}
                        required={field.required}
                        value={draft[field.key]}
                        onChange={event => {
                          setDraft(current => ({ ...current, [field.key]: event.target.value }));
                          setError("");
                        }}
                        placeholder={field.hint}
                      />
                    )}
                  </div>
                ))}
              </div>
              {error && (
                <p className="report-field-error" role="alert">
                  {error}
                </p>
              )}
              <div className="report-stage-actions">
                <button type="button" className="report-secondary focus-ring" onClick={() => goTo(1)}>
                  Back
                </button>
                <button type="button" className="report-secondary focus-ring" onClick={() => goTo(3)}>
                  Skip draft
                </button>
                <button type="button" className="site-action site-action-dark focus-ring" onClick={continueFromDraft}>
                  Review and verify <ArrowRight size={16} aria-hidden="true" />
                </button>
              </div>
            </section>
          )}
          {step === 3 && (
            <section className="report-stage" aria-labelledby="report-stage-title">
              <span className="report-stage-kicker">STEP 04 / 04</span>
              <h2 id="report-stage-title" tabIndex={-1} ref={titleRef}>
                Test the reviewed PoC.
              </h2>
              <p>
                Submit the reviewed vault claim using your invited researcher token to run the vulnerable or patched Foundry job, or open the protected program view with the team token to inspect submitted claims and private evidence.
              </p>
              <div className="report-review" data-testid="finding-status" aria-live="polite">
                <div className="report-review-head">
                  <h3>{lifecycle.label}</h3>
                </div>
                <p className="text-sm leading-relaxed text-muted">{lifecycle.detail}</p>
              </div>
              {draft.title.trim() && (
                <div className="report-review">
                  <div className="report-review-head">
                    <h3>
                      {submittedClaim
                        ? "Finding notes (local page memory; reviewed claim submitted)"
                        : "Unsent finding draft"}
                    </h3>
                    <button type="button" className="report-secondary focus-ring" onClick={() => goTo(2)}>
                      Edit draft
                    </button>
                  </div>
                  <dl>
                    {fields
                      .filter(field => draft[field.key].trim())
                      .map(field => (
                        <div key={field.key}>
                          <dt>{field.label}</dt>
                          <dd>{draft[field.key]}</dd>
                        </div>
                      ))}
                  </dl>
                </div>
              )}
              <div className="report-boundary">
                <LockKeyhole size={18} aria-hidden="true" />
                <p>
                  The Demo Vault API accepts only the reviewed <code>donation-share-inflation</code> claim and vulnerable or patched local fixture references. The API assigns your role from the bearer token; changing pages never grants access, and neither tokens nor private evidence are saved in URLs or browser storage.
                </p>
              </div>
            </section>
          )}
          <div hidden={step !== 3}>
            <ProgramConsole onSubmissionChange={setSubmittedClaim} onJobChange={setLatestJob} />
          </div>
        </div>
      </div>
    </main>
  );
}
