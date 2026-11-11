import { Card } from "@/components/ui/card";

type Step = { title: string; description: string };
export function JourneySteps({ id, eyebrow, title, steps }: { id: string; eyebrow: string; title: string; steps: Step[] }) {
  return <section className="mt-16" aria-labelledby={id}>
    <p className="mb-3 text-xs font-semibold tracking-widest text-forest">{eyebrow}</p>
    <h2 id={id} className="mb-7 text-3xl font-semibold tracking-tight">{title}</h2>
    <ol className="grid gap-4 md:grid-cols-2">
      {steps.map((step, index) => <li key={step.title}><Card className="h-full p-6"><span className="mb-3 block font-mono text-xs text-forest">0{index + 1}</span><h3 className="mb-2 text-base font-semibold">{step.title}</h3><p className="text-sm leading-relaxed text-muted">{step.description}</p></Card></li>)}
    </ol>
  </section>;
}
