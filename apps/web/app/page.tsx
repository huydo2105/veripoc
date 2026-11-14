import Link from "next/link";
import { ArrowRight, ArrowUpRight, FileCheck2, Bot, Code2, FileText, FlaskConical, ShieldCheck, ReceiptText } from "lucide-react";
import { FixtureCodeCard } from "@/components/landing/fixture-code-card";
import { DemoMetrics } from "@/components/landing/demo-metrics";

const steps = [
  {
    label: "Authorize", title: "Start with a clear boundary.",
    description: "A DeFi team defines the contract, source revision, and rules researchers may investigate. The current demo uses one reviewed local vault fixture; external programs and invitations are planned.",
    points: ["Name the target and source revision", "Set the permitted testing environment", "Invite researchers when program access is live"],
    visual: <FixtureCodeCard />,
  },
  {
    label: "Investigate", title: "Researchers bring their own tools.",
    description: "Independent researchers inspect the authorized code with their preferred AI agents, Foundry, Slither, or manual analysis. They turn a suspected issue into a reproducible claim.",
    points: ["Read the scope before testing", "Investigate with your own agent or tools", "Prepare a claim and executable PoC"],
    visual: <div className="story-visual-inner code-visual"><div className="visual-kicker">RESEARCHER-OWNED TOOLS</div><div className="icon-flow"><span><Code2 aria-hidden="true"/><small>Review</small></span><ArrowRight aria-hidden="true"/><span><Bot aria-hidden="true"/><small>Your agent</small></span><ArrowRight aria-hidden="true"/><span><FileText aria-hidden="true"/><small>PoC claim</small></span></div><p>Bring your own tools. Submit a supported PoC for independent verification.</p></div>,
  },
  {
    label: "Verify", title: "Check the claim. Keep the evidence.",
    description: "VeriPoC sends a reviewed PoC reference to an isolated Foundry worker, then returns a verdict and private evidence receipt. A team still decides validity, remediation, and bounty eligibility.",
    points: ["Reproduce under recorded test conditions", "Compare vulnerable and patched fixtures", "Inspect a private receipt, not a public exploit"],
    visual: <div className="story-visual-inner evidence-visual"><div className="visual-kicker"><FileCheck2 size={16} aria-hidden="true" /> VERIFICATION FLOW</div><div className="icon-flow"><span><FileText aria-hidden="true"/><small>Claim</small></span><ArrowRight aria-hidden="true"/><span><FlaskConical aria-hidden="true"/><small>Foundry</small></span><ArrowRight aria-hidden="true"/><span><ShieldCheck aria-hidden="true"/><small>Check</small></span><ArrowRight aria-hidden="true"/><span><ReceiptText aria-hidden="true"/><small>Receipt</small></span></div><p>Verdicts appear only after a real worker run.</p><Link href="/submit-report" className="visual-link focus-ring">Open real verifier <ArrowUpRight size={16} aria-hidden="true" /></Link></div>,
  },
] as const;

export default function HomePage() {
  return <main id="main">
    <section className="landing-hero site-shell" aria-labelledby="hero-title">
      <p className="landing-overline">SMART-CONTRACT SECURITY · BACKED BY EVIDENCE</p>
      <h1 id="hero-title">Find the vulnerability.<br /><em>Verify the proof.</em></h1>
      <p className="landing-lead">VeriPoC connects DeFi teams with independent security researchers. Teams define authorized scope; researchers bring their own tools and AI agents; one controlled verifier checks submitted proofs of concept.</p>
      <Link href="/get-started" className="site-action site-action-dark focus-ring">Get started <ArrowRight size={17} aria-hidden="true" /></Link>
    </section>

    <div id="how-it-works" className="story-stack">
      {steps.map((step, index) => <section key={step.label} className={"story-section " + (index % 2 ? "story-reverse" : "")} aria-labelledby={"story-" + step.label.toLowerCase()}>
        <div className="site-shell story-grid">
          <div className="story-copy"><h2 id={"story-" + step.label.toLowerCase()}>{step.title}</h2><p>{step.description}</p><ul>{step.points.map(point => <li key={point}><span aria-hidden="true">↗</span>{point}</li>)}</ul></div>
          <div className={"story-visual " + (index === 0 ? "story-visual-editor" : "")}>{step.visual}</div>
        </div>
      </section>)}
    </div>
    <section className="landing-end site-shell"><DemoMetrics /><p className="eyebrow">Two sides. One verifier.</p><h2>Ready to see what a claim can prove?</h2><p>Open the demo opportunity to inspect its scope and follow the same verification journey a researcher and a team would share.</p><Link href="/get-started" className="site-action site-action-dark focus-ring">View opportunities <ArrowRight size={16} aria-hidden="true" /></Link><Link href="/teams/new" className="landing-secondary focus-ring">Have a project to audit? <ArrowUpRight size={16} aria-hidden="true" /></Link></section>
  </main>;
}
