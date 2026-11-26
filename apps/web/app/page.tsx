import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { HomeFaq } from "@/components/landing/home-faq";
import { WorkflowVideoCard } from "@/components/landing/workflow-video-card";

const steps = [
  {
    label: "Authorize", title: "Start with a clear boundary.",
    description: "A DeFi team defines the contract, source revision, and rules researchers may investigate.",
    points: [],
    visual: (
      <WorkflowVideoCard
        src="/workflows/create-bounty.gif"
        ariaLabel="DeFi team workflow: defining contract scope, pinned source revision, and testing rules"
        replayLabel="Replay DeFi team workflow animation"
      />
    ),
  },
  {
    label: "Investigate", title: "Researchers bring their own tools.",
    description: "Independent researchers inspect the authorized code with their preferred AI agents, Foundry, Slither, or manual analysis.",
    points: [],
    visual: (
      <WorkflowVideoCard
        src="/workflows/researcher-submit-report.gif"
        ariaLabel="Security researcher workflow: briefing your AI agent and drafting a reproducible finding"
        replayLabel="Replay security researcher workflow animation"
      />
    ),
  },
  {
    label: "Verify", title: "Check the claim.",
    description: "Auditor sends a reviewed PoC reference to an isolated Foundry worker, then returns a verdict and private evidence receipt.",
    points: [],
    visual: (
      <WorkflowVideoCard
        src="/workflows/verify-real-concordium-badge.gif"
        ariaLabel="Verification workflow: attaching Concordium Agent #1067 badge and verifying the PoC in isolated Foundry"
        replayLabel="Replay verification workflow animation"
      />
    ),
  },
] as const;

export default function HomePage() {
  return <main id="main">
    <section className="landing-hero site-shell" aria-labelledby="hero-title">
      <p className="landing-overline">SMART-CONTRACT SECURITY · BACKED BY EVIDENCE</p>
      <h1 id="hero-title">Find the vulnerability.<br /><em>Verify the proof.</em></h1>
      <p className="landing-lead">Auditor connects DeFi teams with independent security researchers.</p>
      <Link href="/get-started" className="site-action site-action-dark landing-hero-cta focus-ring">Get started <ArrowRight size={24} aria-hidden="true" /></Link>
    </section>

    <div id="how-it-works" className="story-stack">
      {steps.map((step, index) => <section key={step.label} className={"story-section " + (index % 2 ? "story-reverse" : "")} aria-labelledby={"story-" + step.label.toLowerCase()}>
        <div className="site-shell story-grid story-grid-video">
          <div className="story-copy"><h2 id={"story-" + step.label.toLowerCase()}>{step.title}</h2><p>{step.description}</p><ul>{step.points.map(point => <li key={point}><span aria-hidden="true">↗</span>{point}</li>)}</ul></div>
          <div className="story-visual story-visual-editor">{step.visual}</div>
        </div>
      </section>)}
    </div>
  
    <HomeFaq />
  </main>;
}
