"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, LockKeyhole, Plus, Trash2 } from "lucide-react";
import { publishProgram, type ReferenceInput, type RewardInput } from "@/lib/publish-program";
import { ensureWalletSession } from "@/lib/wallet-session";

type Field = { key: string; label: string; hint: string; multiline?: boolean; required?: boolean; type?: string };
const steps: { title: string; intro: string; fields: Field[] }[] = [
  { title: "Project", intro: "Name the program and identify the team responsible for reviewing reports.", fields: [
    { key: "name", label: "Project name", hint: "Example: My vault review", required: true },
    { key: "contact", label: "Team contact", hint: "A team email for private researcher follow-up", type: "email" },
    { key: "visibility", label: "Program visibility", hint: "Public scope is visible to everyone. Private scope requires an invitation.", required: true },
    { key: "researcherAccount", label: "Invite a researcher account", hint: "Optional Concordium account address for private scope." },
    { key: "agentBadge", label: "Invite an agent badge", hint: "Optional signed Concordium agent badge for private scope." },
  ] },
  { title: "Instructions", intro: "Tell researchers and their own AI agents what to investigate and how to prepare a reproducible claim.", fields: [
    { key: "instructions", label: "System overview and investigation goals", hint: "Describe assets, trust boundaries, entry points, and the contract behaviors researchers should inspect.", multiline: true, required: true },
    { key: "invariants", label: "Security invariants", hint: "State properties that must always hold, such as deposited assets never minting zero shares or unauthorized withdrawals never succeeding.", multiline: true },
    { key: "submission", label: "Required finding format", hint: "Ask for affected file and revision, root cause, impact, exact runnable PoC command, expected and observed results, and suggested mitigation.", multiline: true },
  ] },
  { title: "Scope", intro: "List exactly what may be tested. A source revision and environment make reproduction meaningful.", fields: [
    { key: "sourceUrl", label: "Primary source repository URL", hint: "HTTPS repository URL for the pinned source", type: "url", required: true },
    { key: "sourceRevision", label: "Pinned source commit or digest", hint: "Full 40-character Git commit or 64-character source digest", required: true },
    { key: "scope", label: "Permitted contract paths, one per line", hint: "List exact repository paths or contract identifiers; up to 10.", multiline: true, required: true },
    { key: "chain", label: "Chain and test environment", hint: "evm-local, evm-testnet, or solana-testnet. New programs do not yet have worker verification.", required: true },
    { key: "runLimit", label: "Verification run limit", hint: "An integer from 1 to 20, reserved for a later verifier connection.", type: "number", required: true },
  ] },
  { title: "Exclusions", intro: "State prohibited targets and actions so researchers know where authorization ends.", fields: [
    { key: "outOfScope", label: "Out-of-scope targets", hint: "List excluded contracts, deployments, third-party services, and unsupported versions.", multiline: true },
    { key: "policy", label: "Testing and disclosure policy", hint: "State whether live-chain transactions, production disruption, social engineering, public disclosure, or third-party testing are prohibited.", multiline: true },
  ] },
  { title: "Rewards", intro: "Set proposed USD ranges by severity. No payout is automatic.", fields: [
    { key: "eligibility", label: "Eligibility and decision policy", hint: "Explain that verification evidence supports review but does not automatically qualify a bounty.", multiline: true },
  ] },
  { title: "Links", intro: "Add named source, documentation, or deployment references. Extra links do not expand the permitted scope.", fields: [
    { key: "docsUrl", label: "Technical documentation URL", hint: "https://docs.example.org", type: "url" },
  ] },
  { title: "Agent setup", intro: "Use the preceding steps to draft instructions for researcher-owned agents, then review them before publishing.", fields: [
    { key: "agentContext", label: "Agent-readable setup", hint: "Build and test commands, pinned tool versions, dependencies, and source links.", multiline: true },
    { key: "agentRules", label: "Agent permissions and tool limits", hint: "Specify allowed local tools and network behavior. Do not provide production credentials or authority outside scope.", multiline: true },
  ] },
];
const severities = ["Critical", "High", "Medium", "Low", "Informational"];
const initialRewards: RewardInput[] = severities.map(severity => ({ severity: severity.toLowerCase(), min: "0", max: "0" }));

export function ProgramDraft() {
  const [step, setStep] = useState(0);
  const [values, setValues] = useState<Record<string, string>>({ visibility: "private" });
  const [rewards, setRewards] = useState<RewardInput[]>(initialRewards);
  const [references, setReferences] = useState<ReferenceInput[]>([]);
  const [reviewed, setReviewed] = useState(false);
  const [error, setError] = useState("");
  const [publishing, setPublishing] = useState(false);
  const [publishError, setPublishError] = useState("");
  const [generating, setGenerating] = useState(false);
  const [savedId, setSavedId] = useState<string | null>(null);
  const current = steps[step];
  const fieldsFor = (index: number) => steps[index].fields.filter(field =>
    values.visibility === "private" || !["researcherAccount", "agentBadge"].includes(field.key));
  function changed(key: string, value: string) {
    setValues(previous => ({ ...previous, [key]: value,
      ...(key === "visibility" && value === "public" ? { researcherAccount: "", agentBadge: "" } : {}) }));
    setReviewed(false); setSavedId(null); setPublishError("");
  }
  function next(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setReviewed(false);
    if (step < steps.length - 1) { setStep(step + 1); return; }
    const missing = steps.findIndex((_, index) => fieldsFor(index).some(field => field.required && !values[field.key]?.trim()));
    if (missing !== -1) { setStep(missing); setError("Complete the required fields in this section before previewing."); return; }
    setReviewed(true);
  }
  function rewardChanged(index: number, key: "min" | "max", value: string) {
    setRewards(current => current.map((item, i) => i === index ? { ...item, [key]: value } : item));
    setReviewed(false); setSavedId(null);
  }
  function referenceChanged(index: number, key: keyof ReferenceInput, value: string) {
    setReferences(current => current.map((item, i) => i === index ? { ...item, [key]: value } : item));
    setReviewed(false); setSavedId(null);
  }
  async function generateSetup() {
    setGenerating(true); setError("");
    try {
      const session = await ensureWalletSession();
      const additionalContext = { submissionFormat: values.submission ?? "", eligibility: values.eligibility ?? "",
        docsUrl: values.docsUrl ?? "", runLimit: values.runLimit ?? "", rewards, references };
      const response = await fetch("/v1/programs/agent-setup", { method: "POST", credentials: "same-origin",
        headers: { "content-type": "application/json", "x-veripoc-csrf": session.csrfToken },
        body: JSON.stringify({ name: values.name, sourceUrl: values.sourceUrl, sourceRevision: values.sourceRevision,
          chain: values.chain, permittedTargets: values.scope, instructions: values.instructions,
          invariants: values.invariants ?? "", exclusions: values.outOfScope ?? "", policy: values.policy ?? "",
          additionalContext: JSON.stringify(additionalContext) }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "AI draft is unavailable.");
      setValues(previous => ({ ...previous, agentContext: result.agentContext, agentRules: result.agentRules }));
      setReviewed(false); setSavedId(null);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "AI draft is unavailable."); }
    finally { setGenerating(false); }
  }
  async function publish() {
    setPublishing(true);
    setPublishError("");
    try { setSavedId(await publishProgram(values, rewards, references)); }
    catch (cause) { setPublishError(cause instanceof Error ? cause.message : "Program could not be saved."); }
    finally { setPublishing(false); }
  }
  return <main id="main" className="site-shell draft-page">
    <Link href="/get-started" className="back-link focus-ring"><ArrowLeft size={16} aria-hidden="true" /> Back to opportunities</Link>
    <div className="section-head"><h1>Create a bug bounty project</h1><p>Build clear instructions and an authorized scope for independent researchers and their AI agents. Preview the draft, then publish it with your Concordium team account.</p></div>
    <div className="draft-wizard">
      <nav aria-label="Draft sections" className="draft-steps">{steps.map((item, index) => <button type="button" key={item.title} className="focus-ring" aria-current={step === index ? "step" : undefined} onClick={() => { setStep(index); setReviewed(false); setError(""); }}><span>{index < step ? <Check size={15} aria-hidden="true" /> : String(index + 1).padStart(2, "0")}</span>{item.title}</button>)}</nav>
      <div className="draft-stage"><div className="draft-stage-heading"><span>STEP {String(step + 1).padStart(2, "0")} OF {String(steps.length).padStart(2, "0")}</span><h2>{current.title}</h2><p>{current.intro}</p></div>
        {error && <p role="alert" className="text-sm text-forest">{error}</p>}
        <form className="draft-form" onSubmit={next} key={current.title}>{fieldsFor(step).map(field => <div className="draft-field" key={field.key}>
          <div className="draft-field-title"><label htmlFor={field.key}>{field.label}{field.required && <span className="sr-only"> (required)</span>}</label><span className="draft-help-wrap"><button type="button" className="draft-help focus-ring" aria-label={`Help for ${field.label}`} aria-describedby={`${field.key}-help`}>*</button><span className="draft-help-tip" id={`${field.key}-help`} role="tooltip">{field.hint}</span></span></div>
          {field.key === "chain" ? <select id={field.key} value={values.chain ?? ""} required onChange={event => changed(field.key, event.target.value)}><option value="">Choose environment</option><option value="evm-local">EVM local</option><option value="evm-testnet">EVM testnet</option><option value="solana-testnet">Solana testnet</option></select>
            : field.key === "visibility" ? <select id={field.key} value={values.visibility} onChange={event => changed(field.key, event.target.value)}><option value="private">Private — invitation required</option><option value="public">Public — scope visible to everyone</option></select>
            : field.multiline ? <textarea id={field.key} value={values[field.key] ?? ""} onChange={event => changed(field.key, event.target.value)} required={field.required} maxLength={2000} rows={5} placeholder={`Enter ${field.label.toLowerCase()}`} />
              : <input id={field.key} type={field.type ?? "text"} min={field.key === "runLimit" ? 1 : undefined} max={field.key === "runLimit" ? 20 : undefined} value={values[field.key] ?? ""} onChange={event => changed(field.key, event.target.value)} required={field.required} maxLength={300} placeholder={`Enter ${field.label.toLowerCase()}`} />}
        </div>)}
          {current.title === "Rewards" && <div className="reward-editor"><p>Proposed reward ranges in USD. Zero means no reward is offered for that severity.</p><div className="reward-grid" role="group" aria-label="Severity reward ranges">{rewards.map((item, index) => <div key={item.severity} className="reward-row"><strong>{severities[index]}</strong><label>Minimum USD<input type="number" min="0" max="100000000" value={item.min} onChange={event => rewardChanged(index, "min", event.target.value)} /></label><label>Maximum USD<input type="number" min="0" max="100000000" value={item.max} onChange={event => rewardChanged(index, "max", event.target.value)} /></label></div>)}</div><p className="draft-small-note">These ranges guide human review; they do not authorize a payout.</p></div>}
          {current.title === "Links" && <div className="reference-editor"><h3>Additional references</h3><p>Use named rows for source repositories, documentation, or deployed addresses.</p>{references.map((reference, index) => <div key={index} className="reference-row"><label>Type<select value={reference.kind} onChange={event => referenceChanged(index, "kind", event.target.value as ReferenceInput["kind"])}><option value="source">Source</option><option value="documentation">Documentation</option><option value="deployment">Deployment</option></select></label><label>Name<input value={reference.name} onChange={event => referenceChanged(index, "name", event.target.value)} maxLength={100} required /></label><label>HTTPS link or address<input value={reference.url} onChange={event => referenceChanged(index, "url", event.target.value)} maxLength={300} required /></label><button type="button" className="draft-back focus-ring" aria-label={`Remove reference ${index + 1}`} onClick={() => { setReferences(items => items.filter((_, i) => i !== index)); setReviewed(false); setSavedId(null); }}><Trash2 size={16} aria-hidden="true" /></button></div>)}<button type="button" className="draft-back focus-ring" disabled={references.length >= 12} onClick={() => { setReferences(items => [...items, { kind: "source", name: "", url: "" }]); setReviewed(false); setSavedId(null); }}><Plus size={16} aria-hidden="true" /> Add reference</button></div>}
          {current.title === "Agent setup" && <div className="agent-generate"><button type="button" className="site-action focus-ring" disabled={generating} onClick={generateSetup}>{generating ? "Generating draft…" : "Generate agent setup with AI"}</button><p>Sends the preceding draft steps to the configured OpenAI API. Review and edit the result before publishing; generated text cannot expand the authorized scope.</p></div>}
          <div className="draft-actions">{step > 0 && <button type="button" className="draft-back focus-ring" onClick={() => setStep(step - 1)}>Previous</button>}<button type="submit" className="site-action site-action-dark focus-ring">{step === steps.length - 1 ? "Preview unsaved draft" : "Continue"} <ArrowRight size={16} aria-hidden="true" /></button></div>
        </form>
      </div>
    </div>
    <aside className="draft-preview" aria-label="Program draft preview"><div className="draft-preview-head"><LockKeyhole size={17} aria-hidden="true" /> {savedId ? "Saved program" : "Unsaved local preview"}</div><div aria-live="polite"><h2>{values.name?.trim() || "Your project outline"}</h2><dl>{steps.flatMap((_, index) => fieldsFor(index)).filter(field => values[field.key]?.trim()).map(field => <div key={field.key}><dt>{field.label}</dt><dd>{values[field.key]}</dd></div>)}<div><dt>Reward ranges</dt><dd>{rewards.map(item => `${item.severity}: $${item.min || 0}–$${item.max || 0}`).join(" · ")}</dd></div><div><dt>Additional references</dt><dd>{references.length ? references.map(item => `${item.name || "Untitled"}: ${item.url || "No link"}`).join("\n") : "None"}</dd></div><div><dt>Status</dt><dd>{savedId ? "Published · verification not configured" : reviewed ? "Ready for team review · not published" : "Draft in progress · not published"}</dd></div></dl></div>{publishError && <p role="alert">{publishError}</p>}{reviewed && !savedId && <button type="button" className="site-action site-action-dark focus-ring" disabled={publishing} onClick={publish}>{publishing ? "Publishing…" : "Publish authorized program"}</button>}{savedId && <Link className="site-action site-action-dark focus-ring" href={`/programs/${savedId}`}>Open saved program <ArrowRight size={16} aria-hidden="true" /></Link>}</aside>
  </main>;
}
