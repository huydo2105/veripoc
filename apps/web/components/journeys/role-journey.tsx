import Link from "next/link";
import { ArrowLeft, ArrowRight, ArrowUpRight, CheckCircle2, LockKeyhole, Plus } from "lucide-react";
import { RoleWorkflow } from "@/components/journeys/role-workflow";

type Role = "team" | "researcher";

function RoleTabs({ role }: { role: Role }) {
  return <nav className="role-tabs" aria-label="Choose an audit path">
    <Link href="/researchers/start" aria-current={role === "researcher" ? "page" : undefined} className="role-tab focus-ring">I want to audit</Link>
    <Link href="/teams/start" aria-current={role === "team" ? "page" : undefined} className="role-tab focus-ring">I have a project to audit</Link>
  </nav>;
}

export function RoleJourney({ role }: { role: Role }) {
  const researcher = role === "researcher";
  return <main id="main" className="site-shell journey-page">
    <Link href="/get-started" className="back-link focus-ring"><ArrowLeft size={16} aria-hidden="true" /> All opportunities</Link>
    <section className="journey-hero" aria-labelledby="journey-title">
      <p className="eyebrow">{researcher ? "Reviewed local opportunity" : "For DeFi teams"}</p>
      <h1 id="journey-title" className="site-title">{researcher ? <>Demo Vault <em>Audit Program.</em></> : <>Bring your contracts.<br /><em>See the evidence.</em></>}</h1>
      <p>{researcher ? "Inspect the approved local vault fixture, understand the permitted scope, then follow a reproducible claim through the shared Foundry verifier." : "See how a scoped audit program would connect your team, independent researchers, and one shared verification engine."}</p>
      <RoleTabs role={role} />
    </section>
    <section className="detail-overview" aria-labelledby="detail-title">
      <div className="detail-header"><span className="directory-badge"><CheckCircle2 size={14} aria-hidden="true" /> Runnable local demo</span><span>ERC-4626-style vault · no bounty offered</span></div>
      <div className="detail-grid">
        <div className="detail-main"><h2 id="detail-title">{researcher ? "What you can investigate" : "What the team would define"}</h2><p>The reviewed fixture contains a vulnerable vault and a patched control. A donation can change the vulnerable vault&apos;s share calculation before a victim deposit. The same trusted Foundry PoC checks whether the patched fixture resists that behavior.</p><p className="detail-warning"><LockKeyhole size={18} aria-hidden="true" /> This is a synthetic local demonstration, not permission to test any deployed contract.</p></div>
        <dl className="detail-facts"><div><dt>Target</dt><dd>contracts/evm/FixtureVault.sol</dd></div><div><dt>PoC reference</dt><dd>test/TrustedVaultWorker.t.sol</dd></div><div><dt>Permitted environment</dt><dd>Isolated local Foundry worker</dd></div><div><dt>Access</dt><dd>Public demo explanation; no external invitation</dd></div><div><dt>Submission</dt><dd>Reviewed fixture references only</dd></div></dl>
      </div>
    </section>
    {researcher ? <section className="detail-instructions"><p className="eyebrow">Researcher submission path</p><h2>From bug report to verification.</h2><div className="detail-instruction-grid"><div><span>01</span><h3>Review the rules</h3><p>Stay within the reviewed local vault fixture. External contracts and arbitrary code uploads are not accepted.</p></div><div><span>02</span><h3>Develop the claim</h3><p>Use your own agent, tools, or manual analysis to understand the share-inflation behavior.</p></div><div><span>03</span><h3>Run the reviewed PoC</h3><p>Open the verifier, select the vulnerable or patched fixture, submit with the local API token, and inspect the returned job and private receipt.</p></div></div></section>
      : <section className="detail-instructions team-instructions"><div><p className="eyebrow">Team program preview</p><h2>Define scope before inviting anyone.</h2><p>Program creation, researcher invitations, confidential finding access, and ownership checks require Issue #35. You can preview an unsaved project description now.</p></div><Link href="/teams/new" className="site-action site-action-dark focus-ring"><Plus size={16} aria-hidden="true" /> Preview unsaved project <ArrowUpRight size={16} aria-hidden="true" /></Link></section>}
    <RoleWorkflow role={role} />
    <section className="journey-end"><p className="eyebrow">One shared verifier</p><h2>Ready to see the actual run?</h2><p>The console submits a reviewed fixture reference to the existing authenticated API. Verdicts and receipts appear only after real backend execution. No code upload or external target is enabled.</p><Link href="/verify" className="site-action site-action-dark focus-ring">Open verification console <ArrowRight size={16} aria-hidden="true" /></Link></section>
  </main>;
}
