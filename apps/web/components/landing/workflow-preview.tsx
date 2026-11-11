// Static, semantic stage structure reserved for Issue #39's interactive walkthrough.
const steps = [
  { title: "Authorize", detail: "A team defines the contracts and rules researchers may investigate. Program permissions are planned." },
  { title: "Investigate", detail: "Researchers use their preferred agents and tools to form a vulnerability claim and PoC." },
  { title: "Verify", detail: "VeriPoC runs a reviewed PoC in isolated Foundry execution and returns evidence for human review." },
];

export function WorkflowPreview() {
  return <section id="how-it-works" className="border-y border-line bg-surface py-16" aria-labelledby="workflow-title">
    <div className="mx-auto max-w-[1160px] px-5 md:px-6">
      <p className="mb-3 text-xs font-semibold tracking-widest text-forest">ONE SHARED WORKFLOW</p>
      <h2 id="workflow-title" className="mb-8 text-3xl font-semibold tracking-tight">How it works</h2>
      <ol className="grid gap-8 md:grid-cols-3">
        {steps.map((step, index) => <li key={step.title} className="border-t border-line pt-5">
          <span className="mb-5 block font-mono text-xs text-forest">0{index + 1}</span>
          <h3 className="mb-2 text-xl font-semibold">{step.title}</h3>
          <p className="max-w-[36ch] text-sm leading-relaxed text-muted">{step.detail}</p>
        </li>)}
      </ol>
    </div>
  </section>;
}
