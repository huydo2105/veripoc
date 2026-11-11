import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function DemoEntry({ title, description }: { title: string; description: string }) {
  return <section className="mt-14 flex flex-col items-start justify-between gap-7 rounded-[14px] border border-[#c9dfd0] bg-forest-soft p-6 md:flex-row md:items-end md:p-8" aria-labelledby="demo-entry-title">
    <div><p className="mb-2 text-xs font-semibold tracking-widest text-forest">AVAILABLE DEMO</p><h2 id="demo-entry-title" className="mb-3 text-2xl font-semibold">{title}</h2><p className="max-w-[68ch] text-sm leading-relaxed text-muted">{description}</p></div>
    <Button asChild className="w-full shrink-0 md:w-auto"><Link href="/verify">Open verification demo <ArrowRight size={16} aria-hidden="true" /></Link></Button>
  </section>;
}
