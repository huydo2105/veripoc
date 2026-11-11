import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

const journeys = {
  team: {
    audience: "For DeFi teams",
    title: "Scope the audit.",
    emphasis: "Review the evidence.",
    summary: "Set boundaries for researchers and check whether a patch stops the same attack.",
    steps: ["Define the contracts and testing rules.", "Invite researchers and review findings.", "Re-run the PoC against the patch."],
    availability: "Program permissions and the findings inbox are planned. The verifier runs reviewed local vault fixtures.",
  },
  researcher: {
    audience: "For researchers",
    title: "Find the issue.",
    emphasis: "Show the proof.",
    summary: "Use your own tools or AI agent to investigate authorized contracts.",
    steps: ["Check the permitted contracts and environment.", "Write a vulnerability claim and executable PoC.", "Inspect the verdict and private receipt."],
    availability: "The verifier accepts reviewed local vault fixtures. Agent access and new PoC submissions are planned.",
  },
} as const;

export function RoleJourney({ role }: { role: keyof typeof journeys }) {
  const journey = journeys[role];
  return (
    <main id="main" className="site-shell pb-16">
      <section className="site-hero">
        <p className="mb-3 text-sm font-semibold text-muted">{journey.audience}</p>
        <h1 className="site-title">{journey.title}<br /><span>{journey.emphasis}</span></h1>
        <p className="mt-5 max-w-xl text-muted">{journey.summary}</p>
      </section>
      <section aria-labelledby="journey-title" className="border-y border-line py-6">
        <h2 id="journey-title" className="mb-3 text-xl font-semibold tracking-tight">Audit workflow</h2>
        <ol className="grid gap-3 md:grid-cols-3">
          {journey.steps.map(step => (
            <li key={step} className="rounded-lg border border-line bg-surface p-4 text-sm">{step}</li>
          ))}
        </ol>
        <p className="mt-5 max-w-2xl text-sm text-muted">{journey.availability}</p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link className="site-action site-action-dark focus-ring" href="/verify">
            Open verifier <ArrowUpRight size={15} aria-hidden="true" />
          </Link>
          <Link className="site-action focus-ring" href="/workflow">Explore workflow</Link>
        </div>
      </section>
    </main>
  );
}
