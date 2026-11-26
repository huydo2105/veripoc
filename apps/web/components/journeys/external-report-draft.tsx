"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, ArrowUpRight, Bot, Check, Clipboard, FileCode2, FileText, ShieldCheck } from "lucide-react";
import bounties from "@/public/data/bug-bounties.json";

type Bounty = (typeof bounties)[number];
type Field = "title" | "asset" | "impact" | "reproduction" | "tools";
const fields: { key: Field; label: string; placeholder: string; required: boolean; long?: boolean }[] = [
  { key: "title", label: "Finding title", placeholder: "Describe the suspected issue", required: true },
  { key: "asset", label: "Affected asset and revision", placeholder: "Use the exact target from the official scope", required: true },
  { key: "impact", label: "Impact and broken invariant", placeholder: "What could go wrong, and under which conditions?", required: true, long: true },
  { key: "reproduction", label: "Reproduction steps and PoC", placeholder: "Record the local test, inputs, expected result and observed result", required: true, long: true },
  { key: "tools", label: "Research tools or agent used", placeholder: "Optional: describe tools and human review", required: false },
];
const blank: Record<Field, string> = { title: "", asset: "", impact: "", reproduction: "", tools: "" };
const stages = [
  { title: "Review scope", icon: FileCode2 },
  { title: "Brief your agent", icon: Bot },
  { title: "Draft the finding", icon: FileText },
  { title: "Review and submit", icon: ShieldCheck },
] as const;

function researchBrief(bounty: Bounty) {
  return `Research brief — ${bounty.title}\n\nOfficial rules: ${bounty.programUrl}\nCurrent scope: ${bounty.scopeUrl}\nResources: ${bounty.resourcesUrl}${bounty.auditsUrl ? `\nPrior audits: ${bounty.auditsUrl}` : ""}\n\nRead the current rules and exclusions first. Investigate only assets allowed by the program. Use public source and permitted local tools; do not probe live deployments or public testnets unless the current rules explicitly allow it. Treat agent output as a hypothesis. Return affected asset and revision, impact, broken invariant, local reproduction steps, and a reviewable PoC. Keep unpublished findings private. The researcher must review the result and submit through the official program.`;
}

export function ExternalReportDraft({ bounty }: { bounty: Bounty }) {
  const [step, setStep] = useState(0);
  const [furthest, setFurthest] = useState(0);
  const [draft, setDraft] = useState(blank);
  const [message, setMessage] = useState("");
  const titleRef = useRef<HTMLHeadingElement>(null);
  const navigated = useRef(false);

  useEffect(() => { if (navigated.current) titleRef.current?.focus(); }, [step]);

  function goTo(next: number) {
    navigated.current = true;
    setMessage("");
    setStep(next);
    setFurthest(current => Math.max(current, next));
    window.scrollTo({ top: 0, behavior: "auto" });
  }

  function formatReport() {
    return `# ${draft.title.trim()}\n\nProgram: ${bounty.title}\nOfficial rules: ${bounty.programUrl}\nOfficial scope: ${bounty.scopeUrl}\n\n## Affected asset and revision\n${draft.asset.trim()}\n\n## Impact and invariant\n${draft.impact.trim()}\n\n## Reproduction and PoC\n${draft.reproduction.trim()}\n\n## Tools and agent\n${draft.tools.trim() || "Not specified"}`;
  }

  async function copyText(value: string, success: string) {
    try { await navigator.clipboard.writeText(value); setMessage(success); }
    catch { setMessage("Clipboard unavailable. Select and copy the text below."); }
  }

  return <main id="main" className="site-shell submit-report report-wizard external-report-draft">
    <Link href={`/opportunities/${bounty.id}`} className="back-link focus-ring"><ArrowLeft size={16} aria-hidden="true" /> {bounty.title} scope</Link>
    <header className="report-wizard-hero"><h1>Turn a finding<br />into a report.</h1><p>Review {bounty.title}&apos;s current scope, investigate with your tools, and prepare a finding for the official program.</p></header>
    <div className="report-wizard-layout">
      <nav className="report-wizard-steps" aria-label="Finding preparation steps"><ol>{stages.map((stage, index) => { const Icon = stage.icon; return <li key={stage.title}><button type="button" className="focus-ring" aria-current={step === index ? "step" : undefined} disabled={index > furthest} onClick={() => goTo(index)}><span className="report-step-icon"><Icon size={18} aria-hidden="true" /></span><span><small>0{index + 1}</small>{stage.title}</span>{index < step && <Check size={15} aria-hidden="true" />}</button></li>; })}</ol></nav>
      <div className="report-wizard-content">
        {step === 0 && <section className="report-stage" aria-labelledby="external-stage-title"><span className="report-stage-kicker">STEP 01 / 04</span><h2 id="external-stage-title" tabIndex={-1} ref={titleRef}>Know what you may investigate.</h2><p>These notes were checked on {bounty.checkedAt}. The official program controls the complete, current terms.</p><h3>Targets</h3><ul>{bounty.targets.map(item => <li key={item}>{item}</li>)}</ul><h3>Eligible impact categories</h3><ul>{bounty.impacts.map(item => <li key={item}>{item}</li>)}</ul><h3>Scope boundaries</h3><ul>{bounty.scope.map(item => <li key={item}>{item}</li>)}</ul><h3>Instructions and reporting</h3><ul>{[...bounty.instructions, ...bounty.reporting].map(item => <li key={item}>{item}</li>)}</ul><h3>Testing and disclosure limits</h3><ul>{bounty.restrictions.map(item => <li key={item}>{item}</li>)}</ul><div className="report-stage-links"><a href={bounty.programUrl} target="_blank" rel="noopener noreferrer" className="report-inline-link focus-ring">Read complete official instructions <ArrowUpRight size={16} aria-hidden="true" /></a><a href={bounty.scopeUrl} target="_blank" rel="noopener noreferrer" className="report-inline-link focus-ring">Read complete current scope <ArrowUpRight size={16} aria-hidden="true" /></a></div><div className="report-stage-actions"><button type="button" className="site-action site-action-dark focus-ring" onClick={() => goTo(1)}>Continue to agent brief <ArrowRight size={16} aria-hidden="true" /></button></div></section>}
        {step === 1 && <section className="report-stage" aria-labelledby="external-stage-title"><span className="report-stage-kicker">STEP 02 / 04</span><h2 id="external-stage-title" tabIndex={-1} ref={titleRef}>Give your agent a bounded brief.</h2><p>Use your own agent, local tools, or manual review. Check every candidate finding against the current program rules before preparing a report.</p><div className="report-agent-note"><Bot size={21} aria-hidden="true" /><div><strong>Researcher-controlled tools</strong><span>Auditor does not launch an audit of this external program.</span></div></div><div className="report-brief-header"><h3>Research brief</h3><button type="button" className="report-secondary focus-ring" onClick={() => void copyText(researchBrief(bounty), "Brief copied. Review the program rules before using it with your agent.")}><Clipboard size={16} aria-hidden="true" /> Copy brief</button></div><pre className="report-agent-brief">{researchBrief(bounty)}</pre><p role="status" aria-live="polite" className="report-copy-status">{message}</p><div className="report-stage-actions"><button type="button" className="report-secondary focus-ring" onClick={() => goTo(0)}>Back</button><button type="button" className="site-action site-action-dark focus-ring" onClick={() => goTo(2)}>Draft a finding <ArrowRight size={16} aria-hidden="true" /></button></div></section>}
        {step === 2 && <form className="report-stage" aria-labelledby="external-stage-title" onSubmit={event => { event.preventDefault(); goTo(3); }}><span className="report-stage-kicker">STEP 03 / 04</span><h2 id="external-stage-title" tabIndex={-1} ref={titleRef}>Write a reproducible claim.</h2><p>Record a precise claim and the evidence you observed. This draft stays in page memory.</p><div className="report-fields">{fields.map(field => <div key={field.key}><label htmlFor={`external-${field.key}`}>{field.label} <span className="report-optional">{field.required ? "*" : "Optional"}</span></label>{field.long ? <textarea id={`external-${field.key}`} required={field.required} rows={field.key === "reproduction" ? 5 : 3} placeholder={field.placeholder} value={draft[field.key]} onChange={event => setDraft(current => ({ ...current, [field.key]: event.target.value }))} /> : <input id={`external-${field.key}`} required={field.required} placeholder={field.placeholder} value={draft[field.key]} onChange={event => setDraft(current => ({ ...current, [field.key]: event.target.value }))} />}</div>)}</div><div className="report-stage-actions"><button type="button" className="report-secondary focus-ring" onClick={() => goTo(1)}>Back</button><button type="submit" className="site-action site-action-dark focus-ring">Review finding <ArrowRight size={16} aria-hidden="true" /></button></div></form>}
        {step === 3 && <section className="report-stage" aria-labelledby="external-stage-title"><span className="report-stage-kicker">STEP 04 / 04</span><h2 id="external-stage-title" tabIndex={-1} ref={titleRef}>Review before submission.</h2><p>Read the draft, copy it, then submit confidentially through the official program. Nothing has been sent to Auditor or the program owner.</p><pre className="report-agent-brief">{formatReport()}</pre><p role="status" aria-live="polite" className="report-copy-status">{message}</p><div className="report-stage-actions"><button type="button" className="report-secondary focus-ring" onClick={() => goTo(2)}>Edit finding</button><button type="button" className="report-secondary focus-ring" onClick={() => void copyText(formatReport(), "Draft copied. Review it before sharing through the official program.")}><Clipboard size={16} aria-hidden="true" /> Copy report</button><a href={bounty.programUrl} target="_blank" rel="noopener noreferrer" className="site-action site-action-dark focus-ring">Continue on Immunefi <ArrowUpRight size={16} aria-hidden="true" /></a></div></section>}
      </div>
    </div>
  </main>;
}
