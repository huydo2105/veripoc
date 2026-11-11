import type { Metadata } from "next";
import { WorkflowPreview } from "@/components/landing/workflow-preview";

export const metadata: Metadata = { title: "Audit workflow" };

export default function WorkflowPage() {
  return (
    <main id="main" className="site-shell">
      <section className="site-hero">
        <h1 className="site-title">From audit scope<br /><span>to verified evidence.</span></h1>
        <p className="mt-5 max-w-xl text-muted">Follow a share-inflation claim from the audit program to the Foundry verdict.</p>
      </section>
      <WorkflowPreview />
    </main>
  );
}
