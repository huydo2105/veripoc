import { Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { Job, Fixture } from "@/lib/types";
import { FIXTURES, receiptDigest, VERDICTS } from "@/state.mjs";

const empty = "Not available";
function Fact({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return <div className="min-w-0 border-t border-line py-4"><dt className="mb-1 text-xs font-semibold text-muted">{label}</dt><dd className={`${mono ? "mono-data" : ""} m-0 text-sm font-medium text-ink`}>{value}</dd></div>;
}

export function EvidencePanel({ job, fixture, copied, onCopy }: { job: Job | null; fixture: Fixture | null; copied: string; onCopy: () => void }) {
  const receipt = job?.result?.receipt;
  const digest = receiptDigest(job?.result) as string | null;
  const claim = fixture ? FIXTURES[fixture].title : "No claim submitted";
  const status = job?.state === "finished" && job.result ? VERDICTS[job.result.status].label : job?.state ?? "Awaiting run";
  return <section id="evidence" className="scroll-mt-8" aria-labelledby="evidence-title">
    <div className="mb-4"><h2 id="evidence-title" className="text-2xl font-semibold">Evidence report</h2></div>
    <Card className="p-5 md:p-7">
      <p className="mb-5 text-sm leading-relaxed text-muted">This private receipt binds the reviewed fixture, environment and returned verdict. The digest is local only; no Concordium transaction is claimed.</p>
      <dl className="grid gap-x-6 md:grid-cols-2">
        <Fact label="JOB ID" value={job?.id ?? "No job submitted"} mono />
        <Fact label="EXECUTION STATUS" value={status} />
        <Fact label="CLAIM" value={claim} />
        <Fact label="TARGET / FIXTURE" value={fixture ? `${FIXTURES[fixture].contract} / ${fixture}` : empty} />
        <Fact label="INVARIANT OUTCOME" value={receipt?.invariant ? `${receipt.invariant.passed ? "Passed" : "Not passed"} / ${receipt.invariant.name ?? "Unnamed"}` : "Not evaluated"} />
        <Fact label="ENVIRONMENT / CHAIN" value={receipt?.chain?.chainId ? `Chain ${receipt.chain.chainId}, block ${receipt.chain.forkBlock ?? "local"}` : "Local EVM; no fork"} />
        <Fact label="WORKER IMAGE ID" value={receipt?.input?.imageId ?? empty} mono />
        <Fact label="SOURCE INPUT SHA-256" value={receipt?.input?.sourceSha256 ?? empty} mono />
        <Fact label="TOOL VERSIONS" value={receipt?.tools ? `Forge ${receipt.tools.forge ?? "?"} / solc ${receipt.tools.solc ?? "?"}` : empty} />
        <Fact label="EXECUTION LOG SHA-256" value={receipt?.evidence?.executionLogSha256 ?? empty} mono />
      </dl>
      <div className="mt-4 rounded-lg border border-[#c9dfd0] bg-forest-soft p-4"><p className="mb-1 text-xs font-semibold text-forest">LOCAL PUBLIC HASH CANDIDATE</p><p className="mono-data mb-2 text-sm font-medium text-ink">{digest ?? "No receipt yet"}</p><p className="text-xs text-muted">Only a safe digest is suitable for a future public commitment. No on-chain anchor exists for this run.</p></div>
      <details className="mt-5 border-t border-line pt-5"><summary className="focus-ring rounded text-sm font-semibold text-forest">Inspect private evidence JSON</summary><div className="pt-4"><p className="mb-3 text-sm text-muted">This JSON can contain exploit details. Copying places the complete result on your clipboard; share it only with authorized reviewers.</p><Button type="button" variant="outline" disabled={job?.state !== "finished"} onClick={onCopy}><Copy size={16} aria-hidden="true" />{copied}</Button><pre className="mono-data mt-4 max-h-96 overflow-auto rounded-lg border border-line bg-page p-4 text-xs leading-relaxed">{job?.state === "finished" ? JSON.stringify(job, null, 2) : "No finished evidence yet."}</pre></div></details>
      <p className="mt-5 border-t border-line pt-5 text-sm text-muted">A reproduced exploit is valid under tested conditions; it is not a mathematical proof of universal exploitability or automatic bounty eligibility.</p>
    </Card>
  </section>;
}
