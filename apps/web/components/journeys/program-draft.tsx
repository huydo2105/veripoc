"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, LockKeyhole } from "lucide-react";

type Field = { key: string; label: string; hint: string; multiline?: boolean; required?: boolean; type?: string };
const steps: { title: string; intro: string; fields: Field[] }[] = [
  { title: "Project", intro: "Name the program and identify the team responsible for reviewing reports.", fields: [
    { key: "name", label: "Project name", hint: "Example: My vault review", required: true },
    { key: "contact", label: "Team contact", hint: "A team email for private researcher follow-up", type: "email" },
  ] },
  { title: "Instructions", intro: "Tell researchers and their own AI agents what to investigate and how to prepare a reproducible claim.", fields: [
    { key: "instructions", label: "System overview and investigation goals", hint: "Describe assets, trust boundaries, entry points, and the contract behaviors researchers should inspect.", multiline: true, required: true },
    { key: "invariants", label: "Security invariants", hint: "State properties that must always hold, such as deposited assets never minting zero shares or unauthorized withdrawals never succeeding.", multiline: true },
    { key: "submission", label: "Required finding format", hint: "Ask for affected file and revision, root cause, impact, exact runnable PoC command, expected and observed results, and suggested mitigation.", multiline: true },
  ] },
  { title: "Agent access", intro: "Help researcher-owned agents consume the brief safely. Agent APIs and MCP access are planned, not active on this draft.", fields: [
    { key: "agentContext", label: "Agent-readable setup", hint: "Provide build and test commands, pinned tool versions, dependency setup, and a link to source and architecture documents.", multiline: true },
    { key: "agentRules", label: "Agent permissions and tool limits", hint: "Specify allowed local tools and network behavior. Do not give agents production credentials, private RPC endpoints, or authority to test outside scope.", multiline: true },
  ] },
  { title: "Scope", intro: "List exactly what may be tested. A source revision and environment make reproduction meaningful.", fields: [
    { key: "target", label: "Target contract and immutable revision", hint: "Example: Vault.sol at commit abc123…", required: true },
    { key: "scope", label: "Permitted testing scope", hint: "List exact contracts or repository paths, chain and environment, and whether local forks or testnet calls are permitted.", multiline: true, required: true },
  ] },
  { title: "Exclusions", intro: "State prohibited targets and actions so researchers know where authorization ends.", fields: [
    { key: "outOfScope", label: "Out-of-scope targets", hint: "List excluded contracts, deployments, third-party services, and unsupported versions.", multiline: true },
    { key: "policy", label: "Testing and disclosure policy", hint: "State whether live-chain transactions, production disruption, social engineering, public disclosure, or third-party testing are prohibited.", multiline: true },
  ] },
  { title: "Rewards", intro: "Describe a proposed reward policy. This preview does not offer or promise payment.", fields: [
    { key: "rewards", label: "Proposed reward ranges and criteria", hint: "Example: critical / high / medium ranges, impact requirements, duplicate handling, and team discretion.", multiline: true },
    { key: "eligibility", label: "Eligibility and decision policy", hint: "Explain that verification evidence supports review but does not automatically qualify a bounty.", multiline: true },
  ] },
  { title: "Links", intro: "Give researchers the canonical material needed to reproduce and explain a finding.", fields: [
    { key: "sourceUrl", label: "Source repository URL", hint: "https://github.com/your-team/repository", type: "url" },
    { key: "docsUrl", label: "Technical documentation URL", hint: "https://docs.example.org", type: "url" },
  ] },
];

export function ProgramDraft() {
  const [step, setStep] = useState(0);
  const [values, setValues] = useState<Record<string, string>>({});
  const [reviewed, setReviewed] = useState(false);
  const [error, setError] = useState("");
  const current = steps[step];
  function next(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setReviewed(false);
    if (step < steps.length - 1) { setStep(step + 1); return; }
    const missing = steps.findIndex(item => item.fields.some(field => field.required && !values[field.key]?.trim()));
    if (missing !== -1) { setStep(missing); setError("Complete the required fields in this section before previewing."); return; }
    setReviewed(true);
  }
  return <main id="main" className="site-shell draft-page">
    <Link href="/get-started" className="back-link focus-ring"><ArrowLeft size={16} aria-hidden="true" /> Back to opportunities</Link>
    <div className="section-head"><h1>Draft a bug bounty project</h1><p>Build clear instructions and an authorized scope for independent researchers and their AI agents. Review the draft before a future program submission.</p></div>
    <div className="draft-wizard">
      <nav aria-label="Draft sections" className="draft-steps">{steps.map((item, index) => <button type="button" key={item.title} className="focus-ring" aria-current={step === index ? "step" : undefined} onClick={() => { setStep(index); setReviewed(false); setError(""); }}><span>{index < step ? <Check size={15} aria-hidden="true" /> : String(index + 1).padStart(2, "0")}</span>{item.title}</button>)}</nav>
      <div className="draft-stage"><div className="draft-stage-heading"><span>STEP {String(step + 1).padStart(2, "0")} OF {String(steps.length).padStart(2, "0")}</span><h2>{current.title}</h2><p>{current.intro}</p></div>
        {error && <p role="alert" className="text-sm text-forest">{error}</p>}
        <form className="draft-form" onSubmit={next} key={current.title}>{current.fields.map(field => <div className="draft-field" key={field.key}>
          <div className="draft-field-title"><label htmlFor={field.key}>{field.label}{field.required && <span className="sr-only"> (required)</span>}</label><span className="draft-help-wrap"><button type="button" className="draft-help focus-ring" aria-label={`Help for ${field.label}`} aria-describedby={`${field.key}-help`}>*</button><span className="draft-help-tip" id={`${field.key}-help`} role="tooltip">{field.hint}</span></span></div>
          {field.multiline ? <textarea id={field.key} value={values[field.key] ?? ""} onChange={event => { setValues({ ...values, [field.key]: event.target.value }); setReviewed(false); }} required={field.required} maxLength={2000} rows={5} placeholder={`Enter ${field.label.toLowerCase()}`} /> : <input id={field.key} type={field.type ?? "text"} value={values[field.key] ?? ""} onChange={event => { setValues({ ...values, [field.key]: event.target.value }); setReviewed(false); }} required={field.required} maxLength={300} placeholder={`Enter ${field.label.toLowerCase()}`} />}
        </div>)}
          <div className="draft-actions">{step > 0 && <button type="button" className="draft-back focus-ring" onClick={() => setStep(step - 1)}>Previous</button>}<button type="submit" className="site-action site-action-dark focus-ring">{step === steps.length - 1 ? "Preview unsaved draft" : "Continue"} <ArrowRight size={16} aria-hidden="true" /></button></div>
        </form>
      </div>
    </div>
    <aside className="draft-preview" aria-label="Program draft preview"><div className="draft-preview-head"><LockKeyhole size={17} aria-hidden="true" /> Unsaved local preview</div><div aria-live="polite"><h2>{values.name?.trim() || "Your project outline"}</h2><dl>{steps.flatMap(item => item.fields).filter(field => values[field.key]?.trim()).map(field => <div key={field.key}><dt>{field.label}</dt><dd>{values[field.key]}</dd></div>)}<div><dt>Status</dt><dd>{reviewed ? "Ready for team review · not published" : "Draft in progress · not published"}</dd></div></dl></div></aside>
  </main>;
}
