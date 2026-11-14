"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Clock3, Search } from "lucide-react";
import { DemoMetrics } from "@/components/landing/demo-metrics";

type Category = "all" | "bounties" | "competitions" | "ended";
const categories: { id: Category; label: string; count: number }[] = [
  { id: "all", label: "All", count: 3 },
  { id: "bounties", label: "Bounties", count: 0 },
  { id: "competitions", label: "Competitions", count: 0 },
  { id: "ended", label: "Ended", count: 0 },
];
const previews = [
  { title: "Lending market review", kind: "Protocol security", description: "Future program layout preview. No approved target, invitation, or payout exists." },
  { title: "AMM pool review", kind: "DeFi infrastructure", description: "Future program layout preview. No approved target, invitation, or payout exists." },
] as const;

function TeamPromo() {
  return <section className="directory-promo" aria-labelledby="promo-title"><p className="eyebrow">For DeFi teams</p><h2 id="promo-title">High-signal findings.<br />Evidence you can review.</h2><p>Preview how your project scope could look. Program publishing, invitations, and bounty payouts are not live yet.</p><Link href="/teams/new" className="site-action site-action-dark focus-ring">Preview an unsaved project <ArrowRight size={16} aria-hidden="true" /></Link></section>;
}

export function OpportunityList() {
  const [category, setCategory] = useState<Category>("all");
  const [query, setQuery] = useState("");
  const matches = (text: string) => text.toLowerCase().includes(query.trim().toLowerCase());
  const showVault = category === "all" && matches("Demo Vault Audit Program ERC-4626 local fixture");
  const visiblePreviews = category === "all" ? previews.filter(item => matches(item.title + " " + item.kind)) : [];
  const count = Number(showVault) + visiblePreviews.length;

  return <main id="main" className="site-shell directory-page">
    <section className="directory-hero" aria-labelledby="directory-title"><h1 id="directory-title">Opportunities</h1><p>Explore the reviewed local vault program and see how future authorized programs could appear. Only the vault fixture can run today.</p></section>
    <div className="directory-content">
      <DemoMetrics />
      <div className="directory-tabs" role="group" aria-label="Opportunity category">
        {categories.map(item => <button key={item.id} type="button" className="focus-ring" aria-pressed={category === item.id} onClick={() => setCategory(item.id)}>{item.label} <span>{item.count}</span></button>)}
      </div>
      <label className="directory-search"><Search size={17} aria-hidden="true" /><span className="sr-only">Search opportunities</span><input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Search opportunities" /></label>
      <div className="directory-list" aria-live="polite">
        {showVault && <Link href="/opportunities/demo-vault" className="directory-row directory-live focus-ring" aria-label="Open Demo Vault Audit Program details">
          <div className="directory-row-main"><span className="directory-mark"><Image src="/brand/veripoc-mark.svg" width={30} height={30} alt="" aria-hidden="true" /></span><div><strong>Demo Vault Audit Program</strong><small>VeriPoC reviewed synthetic fixture</small></div><span className="directory-reward">No bounty<small>Local demo</small></span></div>
          <div className="directory-row-foot"><span>PoC verification</span><span className="directory-badge"><CheckCircle2 size={14} aria-hidden="true" /> Runnable demo</span><span>ERC-4626-style vault</span><span className="directory-date">Reviewed local fixture <ArrowRight size={16} aria-hidden="true" /></span></div>
        </Link>}
        {showVault && <TeamPromo />}
        {visiblePreviews.map(item => <article key={item.title} className="directory-row directory-preview" aria-label={item.title + ", preview unavailable"}>
          <div className="directory-row-main"><span className="directory-mark directory-mark-muted" aria-hidden="true">—</span><div><strong>{item.title}</strong><small>Future listing concept · no live customer program</small></div><span className="directory-reward">No payout<small>Preview only</small></span></div>
          <div className="directory-row-foot"><span>{item.kind}</span><span className="directory-badge directory-badge-muted"><Clock3 size={14} aria-hidden="true" /> Preview · unavailable</span><span className="directory-preview-description">{item.description}</span></div>
        </article>)}
        {count === 0 && <div className="directory-empty" role="status"><h2>No matching programs</h2><p>{category === "all" ? "Try another search. The local vault is the only runnable demo." : "There are no live " + category + " in VeriPoC yet. The reviewed vault remains available under All."}</p></div>}
      </div>
      <p className="directory-limit">All 3 entries include 2 unavailable previews. A public listing is not permission to investigate an external contract. Real programs and invitations are planned for Issue #35.</p>
    </div>
  </main>;
}
