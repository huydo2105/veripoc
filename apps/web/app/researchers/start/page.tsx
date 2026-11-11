import type { Metadata } from "next";
import { ProgramOverview } from "@/components/journeys/program-overview";
import { JourneySteps } from "@/components/journeys/journey-steps";
import { DemoEntry } from "@/components/journeys/demo-entry";

export const metadata: Metadata = { title: "For researchers" };

export default function ResearcherStartPage() {
  return <main id="main" className="mx-auto max-w-[1160px] px-5 pb-20 pt-16 md:px-6">
    <p className="mb-4 text-xs font-semibold tracking-widest text-forest">FOR SECURITY RESEARCHERS</p>
    <h1 className="max-w-[850px] text-[clamp(2.5rem,5vw,4.4rem)] leading-[1.1] font-semibold tracking-[-.04em]">Investigate within scope. Submit evidence that can be reproduced.</h1>
    <p className="mb-10 mt-5 max-w-[760px] text-lg leading-relaxed text-muted">Bring your own agent and tools. You can explore the local demo without configuring an agent or connecting a wallet.</p>
    <ProgramOverview summary="This is a reviewed fixture demonstration, not a real customer program or authorization to test third-party contracts. Program membership and permissions are planned for Issue #35." facts={[
      { label: "Permitted demo scope", value: "Local vulnerable and patched ERC-4626-style vault fixtures only" },
      { label: "Testing rules", value: "Use the reviewed repository PoC; no live networks, external targets, or arbitrary uploads" },
      { label: "Your tools", value: "Manual work or your own AI agent, Slither, fuzzers, and other tools; no model is required" },
      { label: "Finding and evidence", value: "Select a reviewed claim in the console; inspect its actual verdict and private receipt" },
    ]} />
    <JourneySteps id="research-steps" eyebrow="RESEARCHER WORKFLOW" title="From scope to verified result" steps={[
      { title: "Read the program", description: "Confirm target, source revision, allowed environment, and disclosure rules before investigation." },
      { title: "Investigate your way", description: "Use your preferred agent or tools. REST/MCP access for external agents is planned in Issue #13." },
      { title: "Submit a claim and PoC", description: "The current demo selects a pre-reviewed fixture; free-form finding submission is not available." },
      { title: "Inspect evidence", description: "See the real Foundry verdict and private receipt. Team triage is separate and planned in Issue #36." },
    ]} />
    <DemoEntry title="Try the reviewed vault PoC" description="Run the vulnerable fixture and patched control in the same console used by teams. Private results should be shared only in an authorized channel." />
    <p className="mt-5 text-sm text-muted">A reproduced PoC applies only under tested conditions. It does not guarantee severity, contract safety, or bounty eligibility.</p>
  </main>;
}
