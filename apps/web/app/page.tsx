import Link from "next/link";
import { ArrowRight, ArrowUpRight, Code2, FileCheck2, LockKeyhole } from "lucide-react";

const excerpt = [
  "function previewDeposit(uint256 assets)",
  "    public view override returns (uint256) {",
  "    return totalSupply == 0 ? assets",
  "        : assets * totalSupply / totalAssets();",
  "}",
].join("\n");

const steps = [
  {
    number: "01", label: "Authorize", title: "Start with a clear boundary.",
    description: "A DeFi team defines the contract, source revision, and rules researchers may investigate. The current demo uses one reviewed local vault fixture; external programs and invitations are planned.",
    points: ["Name the target and source revision", "Set the permitted testing environment", "Invite researchers when program access is live"],
    visual: <div className="story-visual-inner scope-visual"><div className="visual-kicker"><LockKeyhole size={16} aria-hidden="true" /> REVIEWED LOCAL FIXTURE</div><h3>Demo Vault Audit Program</h3><p>ERC-4626-style vault · synthetic target</p><dl><div><dt>Target</dt><dd>FixtureVault.sol</dd></div><div><dt>Source</dt><dd>Reviewed repository revision</dd></div><div><dt>Execution</dt><dd>Isolated local Foundry worker</dd></div></dl><span className="visual-footnote">No external contract is authorized by this demo.</span></div>,
  },
  {
    number: "02", label: "Investigate", title: "Researchers bring their own tools.",
    description: "Independent researchers inspect the authorized code with their preferred AI agents, Foundry, Slither, or manual analysis. They turn a suspected issue into a reproducible claim.",
    points: ["Read the scope before testing", "Investigate with your own agent or tools", "Prepare a claim and executable PoC"],
    visual: <div className="story-visual-inner code-visual"><div className="visual-kicker"><Code2 size={16} aria-hidden="true" /> CONTRACT EXCERPT · READ ONLY</div><pre><code>{excerpt}</code></pre><p>In the reviewed vulnerable fixture, a donation can make a later deposit mint zero shares.</p><span className="visual-footnote">Source display does not execute or scan a contract.</span></div>,
  },
  {
    number: "03", label: "Verify", title: "Check the claim. Keep the evidence.",
    description: "VeriPoC sends a reviewed PoC reference to an isolated Foundry worker, then returns a verdict and private evidence receipt. A team still decides validity, remediation, and bounty eligibility.",
    points: ["Reproduce under recorded test conditions", "Compare vulnerable and patched fixtures", "Inspect a private receipt, not a public exploit"],
    visual: <div className="story-visual-inner evidence-visual"><div className="visual-kicker"><FileCheck2 size={16} aria-hidden="true" /> VERIFICATION FLOW</div><div className="evidence-line"><span>Submitted claim</span><ArrowRight size={17} aria-hidden="true" /><span>Foundry worker</span></div><div className="evidence-line"><span>Invariant check</span><ArrowRight size={17} aria-hidden="true" /><span>Private receipt</span></div><p>Verdicts and balances appear only after an actual backend job returns evidence.</p><Link href="/verify" className="visual-link focus-ring">Open real verifier <ArrowUpRight size={16} aria-hidden="true" /></Link></div>,
  },
] as const;

export default function HomePage() {
  return <main id="main">
    <section className="landing-hero site-shell" aria-labelledby="hero-title">
      <p className="landing-overline">SMART-CONTRACT SECURITY · BACKED BY EVIDENCE</p>
      <h1 id="hero-title">Find the vulnerability.<br /><em>Verify the proof.</em></h1>
      <p className="landing-lead">VeriPoC connects DeFi teams with independent security researchers. Teams define authorized scope; researchers bring their own tools and AI agents; one controlled verifier checks submitted proofs of concept.</p>
      <Link href="/get-started" className="site-action site-action-dark focus-ring">Get started <ArrowRight size={17} aria-hidden="true" /></Link>
      <p className="landing-disclosure">Explore the reviewed local vault demo. No account or wallet needed to browse.</p>
      <div className="landing-scroll-cue" aria-hidden="true"><span /> SCROLL TO SEE HOW IT WORKS</div>
    </section>

    <div id="how-it-works" className="story-intro site-shell"><p className="eyebrow">How VeriPoC works</p><h2>One shared path from scope to evidence.</h2><p>Each stage has a clear owner. The only executable target today is the reviewed demo vault.</p></div>
    <div className="story-stack">
      {steps.map((step, index) => <section key={step.number} className={"story-section " + (index % 2 ? "story-reverse" : "")} aria-labelledby={"story-" + step.number}>
        <div className="site-shell story-grid">
          <div className="story-copy"><span className="story-number">{step.number} / 03 · {step.label}</span><h2 id={"story-" + step.number}>{step.title}</h2><p>{step.description}</p><ul>{step.points.map(point => <li key={point}><span aria-hidden="true">↗</span>{point}</li>)}</ul>{index === 2 && <Link href="/get-started" className="site-action site-action-dark focus-ring">Explore the demo <ArrowRight size={16} aria-hidden="true" /></Link>}</div>
          <div className="story-visual">{step.visual}</div>
        </div>
      </section>)}
    </div>
    <section className="landing-end site-shell"><p className="eyebrow">Two sides. One verifier.</p><h2>Ready to see what a claim can prove?</h2><p>Open the demo opportunity to inspect its scope and follow the same verification journey a researcher and a team would share.</p><Link href="/get-started" className="site-action site-action-dark focus-ring">View opportunities <ArrowRight size={16} aria-hidden="true" /></Link><Link href="/teams/start" className="landing-secondary focus-ring">Have a project to audit? <ArrowUpRight size={16} aria-hidden="true" /></Link></section>
  </main>;
}
