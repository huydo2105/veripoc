import Link from "next/link";
import { RoleCard } from "@/components/landing/role-card";
import { WorkflowPreview } from "@/components/landing/workflow-preview";

export default function HomePage() {
  return <main id="main">
    <section className="mx-auto max-w-[1160px] px-5 pb-10 pt-20 md:px-6 md:pt-28" aria-labelledby="hero-title">
      <p className="mb-5 text-xs font-semibold tracking-widest text-forest">VERIPOC / SECURITY EVIDENCE</p>
      <h1 id="hero-title" className="max-w-[850px] text-[clamp(2.6rem,5.2vw,4.7rem)] leading-[1.08] font-semibold tracking-[-.045em]">Find vulnerabilities.<br /><span className="text-forest">Verify the evidence.</span></h1>
      <p className="mt-6 max-w-[760px] text-lg leading-relaxed text-muted">A shared smart-contract security workspace for DeFi teams and independent researchers using their own AI agents.</p>
    </section>
    <section className="mx-auto max-w-[1160px] px-5 pb-20 md:px-6" aria-labelledby="choices-title">
      <h2 id="choices-title" className="mb-6 text-xl font-semibold">What would you like to do?</h2>
      <div className="grid gap-5 md:grid-cols-2"><RoleCard role="team" /><RoleCard role="researcher" /></div>
      <p className="mt-5 text-sm text-muted">Exploring the demo requires no account or wallet. The current verifier supports reviewed local vault fixtures only.</p>
    </section>
    <WorkflowPreview />
    <aside className="mx-auto grid max-w-[1160px] gap-8 px-5 py-12 text-sm leading-relaxed text-muted md:grid-cols-2 md:px-6" aria-label="Current capability and provenance">
      <p><strong className="text-ink">Demo today:</strong> one reviewed vault PoC, vulnerable and patched fixtures, and a private local evidence receipt. A reproduced result applies only under tested conditions.</p>
      <p><strong className="text-ink">Concordium:</strong> the <Link className="focus-ring text-forest underline underline-offset-4" href="/.well-known/agent-card.json">published Agent Card</Link> identifies Agent #1067. Signed requests and Testnet receipt anchoring are planned; no on-chain receipt is claimed here.</p>
    </aside>
  </main>;
}
