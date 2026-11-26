"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ensureWalletSession } from "@/lib/wallet-session";
import { SEVERITY_META } from "@/components/journeys/program-draft";

const severityColor = Object.fromEntries(SEVERITY_META.map(item => [item.id, item.color]));
const severityLabel = Object.fromEntries(SEVERITY_META.map(item => [item.id, item.label]));

type Program = { id: string; name: string; ownerAccount: string; sourceUrl: string; sourceRevision: string;
  chain: string; status: string; verification: string; permittedTargets: string[]; rules: string;
  exclusions: string; runLimit: number; visibility: "private" | "public"; contact?: string; docsUrl?: string;
  agentContext?: string; rewardCurrency?: string; rewardTiers?: { severity: string; min: number; max: number }[];
  references?: { kind: string; name: string; url: string }[];
  invitedResearcherAccounts?: string[]; invitedAgentBadges?: string[] };

export function SavedPrograms({ id, embedded = false }: { id?: string; embedded?: boolean }) {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<{ account: string; csrfToken: string } | null>(null);
  const [invite, setInvite] = useState("");
  const [inviteKind, setInviteKind] = useState<"researcher-account" | "agent-badge">("researcher-account");
  const [busy, setBusy] = useState(false);
  const [refresh, setRefresh] = useState(0);
  useEffect(() => {
    let active = true;
    const paths = id ? [`/v1/programs/${id}`] : ["/v1/programs/mine", "/v1/programs/invited"];
    fetch("/v1/auth/me", { credentials: "same-origin", cache: "no-store" }).then(response => response.json())
      .then(data => { if (active && data.authenticated) setSession(data); }).catch(() => {});
    Promise.all(paths.map(path => fetch(path, { credentials: "same-origin", cache: "no-store" })
      .then(async response => ({ ok: response.ok, data: await response.json() }))))
      .then(results => {
        if (!active) return;
        if (results.every(result => !result.ok)) { setError("Program not found or access not granted."); return; }
        setPrograms(results.flatMap(result => result.ok ? (id ? [result.data.program] : result.data.programs) : []));
      }).catch(() => { if (active) setError("The program API is unavailable."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id, refresh]);
  async function signIn() {
    setBusy(true);
    setError("");
    try {
      const authenticated = await ensureWalletSession();
      setSession(authenticated);
      setLoading(true);
      setRefresh(value => value + 1);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Wallet sign-in failed."); }
    finally { setBusy(false); }
  }
  async function updateProgram(program: Program, endpoint: string, body: object) {
    if (!session) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`/v1/programs/${program.id}/${endpoint}`, { method: "POST",
        credentials: "same-origin", headers: { "content-type": "application/json", "x-auditor-csrf": session.csrfToken },
        body: JSON.stringify(body) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not update program.");
      setPrograms(current => current.map(item => item.id === program.id ? result.program : item));
      setInvite("");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not update program."); }
    finally { setBusy(false); }
  }
  const content = <>
    {!embedded && <div className="section-head"><h1>{id ? "Authorized program" : "Projects"}</h1></div>}
    {error && <p role="alert">{error}</p>}
    {!session && !loading && programs.length === 0 && <button type="button" className="site-action site-action-dark focus-ring" disabled={busy} onClick={signIn}>{busy ? "Signing in…" : "Sign with Concordium to view programs"}</button>}
    {loading && <p role="status">Loading private programs…</p>}
    {!loading && !error && programs.length === 0 && <p>No accessible saved programs yet.</p>}
    <div className="grid gap-5">{programs.map(program => <article key={program.id} className="draft-preview">
      <h2>{program.name}</h2><p>Status: {program.status} · {program.visibility} scope · Verification: {program.verification}</p>
      <dl><div><dt>Owner account</dt><dd className="break-all">{program.ownerAccount}</dd></div>
        <div><dt>Source</dt><dd className="break-all">{program.sourceUrl} at {program.sourceRevision}</dd></div>
        {program.contact && <div><dt>Team contact</dt><dd>{program.contact}</dd></div>}
        {program.docsUrl && <div><dt>Documentation</dt><dd><a href={program.docsUrl} target="_blank" rel="noopener noreferrer">{program.docsUrl}</a></dd></div>}
        <div><dt>Chain</dt><dd>{program.chain}</dd></div>
        <div><dt>Permitted targets</dt><dd>{program.permittedTargets.join(", ")}</dd></div>
        <div><dt>Rules</dt><dd className="whitespace-pre-wrap">{program.rules}</dd></div>
        <div><dt>Exclusions</dt><dd>{program.exclusions}</dd></div>
        {program.agentContext && <div><dt>Agent setup</dt><dd>{program.agentContext}</dd></div>}
        <div><dt>Proposed reward ranges</dt><dd className="reward-preview-list">{program.rewardTiers?.filter(tier => tier.max > 0 || tier.min > 0).length ? program.rewardTiers.filter(tier => tier.max > 0 || tier.min > 0).map(tier => <span key={tier.severity} className="reward-preview-item"><span className="severity-dot" style={{ backgroundColor: severityColor[tier.severity] ?? "#8B0000" }} aria-hidden="true" />{severityLabel[tier.severity] ?? tier.severity}: ${tier.min}–${tier.max}</span>) : "No reward policy"}</dd></div>
        <div><dt>Additional references</dt><dd>{program.references?.length ? program.references.map(item => <p key={`${item.kind}:${item.url}`}>{item.name} · {item.kind}: {item.url.startsWith("https://") ? <a href={item.url} target="_blank" rel="noopener noreferrer">{item.url}</a> : item.url}</p>) : "None"}</dd></div>
        <div><dt>Run limit</dt><dd>{program.runLimit}</dd></div>
        {program.visibility === "private" && <div><dt>Invited researcher accounts</dt><dd>{program.invitedResearcherAccounts?.length ?? 0}</dd></div>}
        {program.visibility === "private" && <div><dt>Invited agent badges</dt><dd>{program.invitedAgentBadges?.length ?? 0}</dd></div>}</dl>
      {id && program.visibility === "private" && session?.account === program.ownerAccount && <div className="grid gap-3 mt-6">
        <label htmlFor="invite-kind">Invitation type</label>
        <select id="invite-kind" value={inviteKind} onChange={event => setInviteKind(event.target.value as typeof inviteKind)}><option value="researcher-account">Researcher Concordium account</option><option value="agent-badge">Signed agent badge</option></select>
        <label htmlFor="invite-value">{inviteKind === "agent-badge" ? "Agent badge ID" : "Researcher Concordium account"}</label>
        <input id="invite-value" value={invite} onChange={event => setInvite(event.target.value)} placeholder={inviteKind === "agent-badge" ? "Badge ID" : "Account address"} />
        <div className="flex flex-wrap gap-3">
          <button type="button" className="site-action focus-ring" disabled={busy || !invite.trim()} onClick={() => updateProgram(program, "invitations", { action: "invite", kind: inviteKind, value: invite.trim() })}>Invite</button>
          <button type="button" className="site-action focus-ring" disabled={busy || !invite.trim()} onClick={() => updateProgram(program, "invitations", { action: "revoke", kind: inviteKind, value: invite.trim() })}>Revoke</button>
        </div>
      </div>}
      {id && session?.account === program.ownerAccount && program.status !== "closed" && <button type="button" className="site-action focus-ring" disabled={busy} onClick={() => updateProgram(program, "status", { status: program.status === "active" ? "paused" : "active" })}>{program.status === "active" ? "Pause program" : "Resume program"}</button>}
      {!id && <Link href={`/programs/${program.id}`} className="site-action site-action-dark focus-ring">Open program</Link>}
    </article>)}</div>
    <Link href="/teams/new" className="back-link focus-ring">Create a program</Link>
  </>;
  return embedded ? content : <main id="main" className="site-shell draft-page">{content}</main>;
}
