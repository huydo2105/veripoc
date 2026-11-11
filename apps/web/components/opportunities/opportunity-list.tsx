import Link from "next/link";
import { ArrowRight, ArrowUpRight, CheckCircle2, Clock3, Plus } from "lucide-react";

const previews = [
  { name: "Lending market review", kind: "Protocol security", description: "Example of a future scoped lending program. No target, invitation, reward, or submission path exists." },
  { name: "AMM pool review", kind: "DeFi infrastructure", description: "Example of a future scoped pool program. No target, invitation, reward, or submission path exists." },
] as const;

export function OpportunityList() {
  return <main id="main" className="site-shell directory-page">
    <section className="directory-hero" aria-labelledby="directory-title"><p className="eyebrow">Explore VeriPoC</p><h1 id="directory-title">Opportunities</h1><p>Review the scope before you investigate. One local vault demo is runnable today; the other listings only preview how future programs could appear.</p></section>
    <div className="directory-content">
      <div className="directory-heading"><div><p className="eyebrow">Available to explore</p><h2>Audit programs</h2></div><Link href="/teams/new" className="directory-team-link focus-ring"><Plus size={16} aria-hidden="true" /> Have a project? Preview a draft <ArrowUpRight size={15} aria-hidden="true" /></Link></div>
      <div className="directory-list">
        <Link href="/opportunities/demo-vault" className="directory-row directory-live focus-ring" aria-label="Open Demo Vault Audit Program details">
          <span className="directory-mark" aria-hidden="true">V</span><span className="directory-main"><strong>Demo Vault Audit Program</strong><small>Reviewed synthetic ERC-4626-style vault · donation-driven share inflation</small></span>
          <span className="directory-meta"><span className="directory-badge"><CheckCircle2 size={14} aria-hidden="true" /> Runnable local demo</span><small>No bounty offered</small></span><ArrowRight className="directory-arrow" size={20} aria-hidden="true" />
        </Link>
        {previews.map(item => <article key={item.name} className="directory-row directory-preview" aria-label={item.name + ", preview unavailable"}>
          <span className="directory-mark directory-mark-muted" aria-hidden="true">—</span><span className="directory-main"><strong>{item.name}</strong><small>{item.description}</small></span>
          <span className="directory-meta"><span className="directory-badge directory-badge-muted"><Clock3 size={14} aria-hidden="true" /> Preview · unavailable</span><small>{item.kind}</small></span><span className="directory-arrow" aria-hidden="true" />
        </article>)}
      </div>
      <p className="directory-limit">A public preview does not authorize investigation of an external contract. Real programs, invitations, and permissions are planned for Issue #35.</p>
    </div>
    <section className="directory-end"><div><p className="eyebrow">For DeFi teams</p><h2>Want researchers to review your code?</h2><p>See the team journey or make an unsaved preview of a future program. Publishing and inviting are not available yet.</p></div><Link href="/teams/start" className="site-action site-action-dark focus-ring">See the team path <ArrowRight size={16} aria-hidden="true" /></Link></section>
  </main>;
}
