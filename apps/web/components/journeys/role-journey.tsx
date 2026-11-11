import Link from "next/link";
import { ArrowRight, ArrowUpRight, CheckCircle2, Clock3, LockKeyhole, Plus } from "lucide-react";
import { RoleWorkflow } from "@/components/journeys/role-workflow";

type Role = "team" | "researcher";

const previews = [
  { title: "Lending market review", category: "Protocol security", detail: "Preview only · no approved target or program invitation" },
  { title: "AMM pool review", category: "DeFi infrastructure", detail: "Preview only · no approved target or program invitation" },
] as const;

function RoleTabs({ role }: { role: Role }) {
  return <nav className="role-tabs" aria-label="Choose an audit path">
    <Link href="/researchers/start" aria-current={role === "researcher" ? "page" : undefined} className="role-tab focus-ring">I want to audit</Link>
    <Link href="/teams/start" aria-current={role === "team" ? "page" : undefined} className="role-tab focus-ring">I have a project to audit</Link>
  </nav>;
}

function Opportunities() {
  return <section aria-labelledby="opportunities-title" className="opportunity-section">
    <div className="section-head"><p className="eyebrow">Researcher path</p><h2 id="opportunities-title">Explore audit opportunities</h2><p>Only the reviewed Demo Vault program can be opened today. Other listings show the intended directory layout and are not authorized targets.</p></div>
    <div className="opportunity-grid">
      <article className="opportunity-card opportunity-available">
        <div className="opportunity-card-top"><span className="status-chip"><CheckCircle2 size={14} aria-hidden="true" /> Runnable local demo</span><span>ERC-4626-style vault</span></div>
        <h3>Demo Vault Audit Program</h3>
        <p>Investigate donation-driven share inflation in the reviewed local fixture, then compare the same PoC against its patched control.</p>
        <dl><div><dt>Scope</dt><dd>Local synthetic vault only</dd></div><div><dt>Access</dt><dd>Public demo explanation</dd></div><div><dt>Reward</dt><dd>No bounty offered</dd></div></dl>
        <Link href="#role-workflow" className="opportunity-link focus-ring">Review scope and steps <ArrowRight size={16} aria-hidden="true" /></Link>
      </article>
      {previews.map(item => <article className="opportunity-card opportunity-preview" key={item.title}>
        <div className="opportunity-card-top"><span className="status-chip status-preview"><Clock3 size={14} aria-hidden="true" /> Preview · unavailable</span><span>{item.category}</span></div>
        <h3>{item.title}</h3><p>Future program type. No contract address, invitation, PoC submission, or verifier access exists for this listing.</p>
        <p className="opportunity-unavailable">{item.detail}</p>
      </article>)}
    </div>
    <p className="section-disclosure"><LockKeyhole size={17} aria-hidden="true" /> A public preview is not permission to investigate an external contract. Program scopes and invitations are planned for Issue #35.</p>
  </section>;
}

function TeamProgram() {
  return <section aria-labelledby="team-program-title" className="opportunity-section">
    <div className="section-head"><p className="eyebrow">DeFi team path</p><h2 id="team-program-title">Bring a project into scope</h2><p>See how an authorized audit program would connect your team, researchers, and VeriPoC&apos;s shared evidence engine.</p></div>
    <div className="team-program-grid">
      <article className="opportunity-card opportunity-available">
        <div className="opportunity-card-top"><span className="status-chip"><CheckCircle2 size={14} aria-hidden="true" /> Runnable local demo</span><span>Reviewed fixture</span></div>
        <h3>Demo Vault Audit Program</h3><p>This synthetic ERC-4626-style vault is the only target currently accepted by the verifier. The program page illustrates the team view; it does not grant real invitations.</p>
        <dl><div><dt>Target</dt><dd>contracts/evm/FixtureVault.sol</dd></div><div><dt>Environment</dt><dd>Isolated local Foundry worker</dd></div><div><dt>Researcher access</dt><dd>Planned permission gate</dd></div></dl>
        <Link href="#role-workflow" className="opportunity-link focus-ring">Inspect demo workflow <ArrowRight size={16} aria-hidden="true" /></Link>
      </article>
      <article className="new-program-card">
        <div className="new-program-icon"><Plus size={25} aria-hidden="true" /></div>
        <h3>Add a bug bounty project</h3>
        <p>Draft the project name, target and scope to see how a program might look. The draft stays in this browser page and cannot be published or verified yet.</p>
        <Link href="/teams/new" className="site-action site-action-dark focus-ring">Create unsaved draft <ArrowUpRight size={16} aria-hidden="true" /></Link>
        <small>Real program creation, invitations and persistence belong to Issue #35.</small>
      </article>
    </div>
  </section>;
}

export function RoleJourney({ role }: { role: Role }) {
  return <main id="main" className="site-shell journey-page">
    <section className="journey-hero" aria-labelledby="journey-title">
      <p className="eyebrow">Get started with VeriPoC</p>
      <h1 id="journey-title" className="site-title">{role === "team" ? <>Bring your contracts.<br /><span>See the evidence.</span></> : <>Find the issue.<br /><span>Show the proof.</span></>}</h1>
      <p>{role === "team" ? "Define what researchers may investigate, keep findings private, and compare the exploit with a patched control." : "Explore an authorized scope, use your own tools or AI agent, and verify a reproducible claim with Foundry."}</p>
      <RoleTabs role={role} />
    </section>
    {role === "team" ? <TeamProgram /> : <Opportunities />}
    <RoleWorkflow role={role} />
    <section className="journey-end"><p className="eyebrow">One shared verifier</p><h2>Ready to see the actual run?</h2><p>The console submits a reviewed fixture reference to the existing authenticated API. No code upload or external target is enabled.</p><Link href="/verify" className="site-action site-action-dark focus-ring">Open verification console <ArrowRight size={16} aria-hidden="true" /></Link></section>
  </main>;
}
