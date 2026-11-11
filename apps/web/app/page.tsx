import Link from "next/link";
import { ArrowDown } from "lucide-react";
import { RoleCard } from "@/components/landing/role-card";
import { WorkflowPreview } from "@/components/landing/workflow-preview";

export default function HomePage() {
  return (
    <main id="main" className="site-shell">
      <section className="site-hero" aria-labelledby="hero-title">
        <h1 id="hero-title" className="site-title">Find vulnerabilities.<br /><span>Verify the evidence.</span></h1>
        <div className="hero-intro">
          <p>DeFi teams set the scope. Researchers bring their own AI agents. VeriPoC checks the proof.</p>
          <Link href="#how-it-works" className="site-action focus-ring">Explore workflow <ArrowDown size={15} aria-hidden="true" /></Link>
        </div>
        <div className="grid gap-3 md:grid-cols-2" aria-label="Choose your role">
          <RoleCard role="team" />
          <RoleCard role="researcher" />
        </div>
      </section>
      <WorkflowPreview />
    </main>
  );
}
