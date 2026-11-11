import Link from "next/link";
import { ArrowRight, Braces, FileCheck2, LockKeyhole } from "lucide-react";
import { RoleCard } from "@/components/landing/role-card";

export default function HomePage() {
  return <main id="main" className="site-shell">
    <section className="home-hero" aria-labelledby="hero-title">
      <div className="home-hero-copy">
        <p className="eyebrow">Smart-contract security, with receipts</p>
        <h1 id="hero-title" className="site-title">Security claims need <span>evidence.</span></h1>
        <p className="home-lead">VeriPoC brings DeFi teams and independent researchers into one workspace. Researchers investigate authorized code; a controlled Foundry worker checks submitted PoCs.</p>
        <div className="home-actions">
          <Link href="/get-started" className="site-action site-action-dark focus-ring">Get started <ArrowRight size={17} aria-hidden="true" /></Link>
          <span className="text-sm text-muted">Explore the reviewed vault demo without an account.</span>
        </div>
      </div>
      <div className="hero-proof" aria-label="Illustration of the shared verification path">
        <div className="hero-proof-top"><span className="proof-dot" /> <span>DEMO VAULT PROGRAM</span><span>LOCAL FIXTURE</span></div>
        <div className="hero-proof-row"><LockKeyhole size={19} aria-hidden="true" /><div><strong>Scope the target</strong><span>Reviewed local vault fixture only</span></div><small>01</small></div>
        <div className="hero-proof-row"><Braces size={19} aria-hidden="true" /><div><strong>Submit a claim</strong><span>Select the reviewed PoC reference</span></div><small>02</small></div>
        <div className="hero-proof-row"><FileCheck2 size={19} aria-hidden="true" /><div><strong>Check the evidence</strong><span>Foundry returns an actual verdict</span></div><small>03</small></div>
        <div className="hero-proof-foot">One verification engine for both sides. No automatic bounty decision.</div>
      </div>
    </section>

    <section className="home-roles" aria-labelledby="roles-title">
      <div className="section-head"><p className="eyebrow">Choose your path</p><h2 id="roles-title">Two perspectives. One proof.</h2><p>Start with the role that fits you. You can switch at any time.</p></div>
      <div className="grid gap-4 md:grid-cols-2" aria-label="Choose your role"><RoleCard role="team" /><RoleCard role="researcher" /></div>
    </section>

    <section id="how-it-works" className="home-process" aria-labelledby="process-title">
      <div className="section-head"><p className="eyebrow">The shared process</p><h2 id="process-title">From scope to evidence</h2><p>Each audience sees the detailed steps and real vault code on its own page.</p></div>
      <ol className="process-grid">
        <li><span>01</span><h3>Authorize</h3><p>Teams set the contracts and rules researchers may investigate.</p></li>
        <li><span>02</span><h3>Investigate</h3><p>Researchers use their own agents and tools to develop a claim.</p></li>
        <li><span>03</span><h3>Verify</h3><p>VeriPoC runs the reviewed PoC in Foundry and returns private evidence.</p></li>
      </ol>
      <p className="process-note">Current demo: one reviewed local ERC-4626 vault program. Program creation, invitations, arbitrary PoC uploads, and on-chain receipt anchoring are planned.</p>
    </section>
  </main>;
}
