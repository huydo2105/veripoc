import type { Metadata } from "next";
import { ProgramOverview } from "@/components/journeys/program-overview";
import { JourneySteps } from "@/components/journeys/journey-steps";
import { DemoEntry } from "@/components/journeys/demo-entry";

export const metadata: Metadata = { title: "For DeFi teams" };

export default function TeamStartPage() {
  return <main id="main" className="mx-auto max-w-[1160px] px-5 pb-20 pt-16 md:px-6">
    <p className="mb-4 text-xs font-semibold tracking-widest text-forest">FOR DEFI TEAMS</p>
    <h1 className="max-w-[850px] text-[clamp(2.5rem,5vw,4.4rem)] leading-[1.1] font-semibold tracking-[-.04em]">Start with a clear scope. Review evidence with confidence.</h1>
    <p className="mb-10 mt-5 max-w-[760px] text-lg leading-relaxed text-muted">Define what researchers may examine, then review reproducible findings in one shared workflow.</p>
    <ProgramOverview summary="This is a preview of a future authorized program, not a deployed customer audit or a live invitation. Program creation, membership, and permission enforcement belong to Issue #35." facts={[
      { label: "Contract under review", value: "Repository ERC-4626-style vault fixtures" },
      { label: "Who may investigate", value: "Named invitations planned; no researcher access is granted by this page" },
      { label: "Submitted findings", value: "Confidential team inbox planned for Issue #36" },
      { label: "PoC verification", value: "Reviewed local vault fixtures run through the shared Foundry console" },
    ]} />
    <JourneySteps id="team-steps" eyebrow="TEAM WORKFLOW" title="From program to patch" steps={[
      { title: "Define scope", description: "Pin target contracts, immutable source revision, and permitted test conditions. Planned in Issue #35." },
      { title: "Invite researchers", description: "Authorize named people or registered agents. Invitations are planned in Issue #35." },
      { title: "Review findings", description: "Receive confidential reports and inspect real PoC evidence. The inbox is planned in Issue #36." },
      { title: "Retest a patch", description: "Run the same reviewed attack against the patched vault fixture today; team remediation workflow is planned." },
    ]} />
    <DemoEntry title="Inspect the shared verifier" description="Run the approved vulnerable and patched local fixtures. The console shows actual job status and evidence; it does not accept uploads or external contracts. Keep private receipts in an authorized review channel." />
    <p className="mt-5 text-sm text-muted">A reproduced PoC is evidence under tested conditions, not a complete audit or automatic bounty decision.</p>
  </main>;
}
