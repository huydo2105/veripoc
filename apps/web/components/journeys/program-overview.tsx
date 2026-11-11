import { Card } from "@/components/ui/card";

type Fact = { label: string; value: string };
export function ProgramOverview({ summary, facts }: { summary: string; facts: Fact[] }) {
  return <Card className="p-6 md:p-8" as="section" aria-labelledby="program-title">
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div><p className="mb-2 text-xs font-semibold tracking-widest text-forest">ILLUSTRATIVE LOCAL PROGRAM</p><h2 id="program-title" className="text-2xl font-semibold tracking-tight">Demo Vault Audit Program</h2></div>
      <span className="rounded-full border border-[#bcd7c7] bg-forest-soft px-3 py-1 text-xs font-semibold text-forest">Demo only</span>
    </div>
    <p className="my-5 max-w-[80ch] text-sm leading-relaxed text-muted">{summary}</p>
    <dl className="grid gap-x-8 md:grid-cols-2">
      {facts.map(fact => <div key={fact.label} className="min-w-0 border-t border-line py-4"><dt className="mb-1 text-xs font-semibold text-muted">{fact.label}</dt><dd className="m-0 break-words text-sm font-medium text-ink">{fact.value}</dd></div>)}
    </dl>
  </Card>;
}
