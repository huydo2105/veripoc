"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { ArrowLeft, LockKeyhole } from "lucide-react";

type Draft = { name: string; target: string; scope: string };

export function ProgramDraft() {
  const [draft, setDraft] = useState<Draft | null>(null);
  const [name, setName] = useState("");
  const [target, setTarget] = useState("");
  const [scope, setScope] = useState("");

  function preview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setDraft({ name: name.trim(), target: target.trim(), scope: scope.trim() });
  }

  return <main id="main" className="site-shell draft-page">
    <Link href="/teams/start" className="back-link focus-ring"><ArrowLeft size={16} aria-hidden="true" /> Back to team path</Link>
    <div className="section-head"><p className="eyebrow">Team workspace preview</p><h1>Draft a bug bounty project</h1><p>Preview how a scoped audit program could be described. Nothing here is saved, published, sent to the verifier, or treated as authorization.</p></div>
    <div className="draft-grid">
      <form className="draft-form" onSubmit={preview}>
        <label htmlFor="project-name">Project name</label>
        <input id="project-name" value={name} onChange={event => setName(event.target.value)} required maxLength={80} placeholder="Example: My vault review" />
        <label htmlFor="target-revision">Target contract and immutable revision</label>
        <input id="target-revision" value={target} onChange={event => setTarget(event.target.value)} required maxLength={160} placeholder="Example: Vault.sol at commit abc123…" />
        <label htmlFor="testing-scope">Permitted testing scope</label>
        <textarea id="testing-scope" value={scope} onChange={event => setScope(event.target.value)} required maxLength={500} rows={5} placeholder="State which contracts and test environments are permitted." />
        <button type="submit" className="site-action site-action-dark focus-ring">Preview unsaved draft</button>
        <p className="text-sm text-muted">Do not enter private keys, unpublished vulnerabilities, or confidential customer information. This page has no backend submission.</p>
      </form>
      <aside className="draft-preview" aria-label="Program draft preview">
        <div className="draft-preview-head"><LockKeyhole size={17} aria-hidden="true" /> Unsaved local preview</div>
        {draft ? <div aria-live="polite"><h2>{draft.name}</h2><dl><div><dt>Target</dt><dd>{draft.target}</dd></div><div><dt>Scope</dt><dd>{draft.scope}</dd></div><div><dt>Status</dt><dd>Draft only · not published</dd></div></dl></div>
          : <p>Complete the fields to preview the project card. Reloading this page clears the draft.</p>}
        <p className="draft-limit">Program ownership, invitations, confidential findings, rewards, and authorized execution require Issue #35 and later work.</p>
      </aside>
    </div>
  </main>;
}
