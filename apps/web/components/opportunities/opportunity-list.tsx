"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CheckCircle2, ExternalLink, Search } from "lucide-react";
import bounties from "@/public/data/bug-bounties.json";
import publicSources from "@/public/data/public-sources.json";
import { NetworkBadge } from "@/components/opportunities/network-badge";
import { BrandMark } from "@/components/brand/brand-mark";

type Category = "all" | "bounties" | "source" | "practice" | "fixture" | "programs";
type Source = (typeof publicSources)[number];
type PublicProgram = { id: string; name: string; chain: string; sourceRevision: string; verification: string };

function TeamPromo() {
  return <section className="directory-promo" aria-labelledby="promo-title"><p className="eyebrow">For DeFi teams</p><h2 id="promo-title">High-signal findings.<br />Evidence you can review.</h2><p>Define a scoped program and publish it through the local API. New programs do not yet run arbitrary PoCs or settle rewards.</p><Link href="/teams/new" className="site-action site-action-dark focus-ring">Create a program <ArrowRight size={16} aria-hidden="true" /></Link></section>;
}

function SourceRow({ source }: { source: Source }) {
  const practice = source.kind === "practice";
  const url = `https://github.com/${source.repository}/tree/${source.revision}`;
  return <a href={url} target="_blank" rel="noopener noreferrer" className="directory-row directory-source focus-ring" aria-label={`Open official source for ${source.title} on GitHub (new tab)`}>
    <div className="directory-row-main"><span className="directory-mark directory-mark-muted" aria-hidden="true"><Image src={source.logo} width={40} height={40} alt="" className="directory-project-logo" /></span><div><strong>{source.title}</strong><small>{source.owner} · {source.description}</small></div><span className="directory-reward">View source<small>GitHub ↗</small></span></div>
    <div className="directory-row-foot"><span>{practice ? "Practice project" : "Public source"}</span><NetworkBadge ecosystem={source.ecosystem} /><span className="directory-revision">Pinned revision <code>{source.revision.slice(0, 12)}</code></span><span className="directory-date">Read-only reference <ExternalLink size={14} aria-hidden="true" /></span></div>
  </a>;
}

export function OpportunityList() {
  const [category, setCategory] = useState<Category>("all");
  const [query, setQuery] = useState("");
  const [programs, setPrograms] = useState<PublicProgram[]>([]);
  useEffect(() => {
    let active = true;
    fetch("/v1/programs/public", { cache: "no-store" }).then(response => response.ok ? response.json() : null)
      .then(data => { if (active && Array.isArray(data?.programs)) setPrograms(data.programs); }).catch(() => {});
    return () => { active = false; };
  }, []);
  const needle = query.trim().toLowerCase();
  const matches = (value: string) => value.toLowerCase().includes(needle);
  const categories: { id: Category; label: string; count: number }[] = [
    { id: "all", label: "All", count: bounties.length + publicSources.length + programs.length + 1 },
    { id: "bounties", label: "Bug bounties", count: bounties.length },
    { id: "programs", label: "VeriPoC programs", count: programs.length },
    { id: "source", label: "Public source", count: publicSources.filter(item => item.kind === "protocol").length },
    { id: "practice", label: "Practice labs", count: publicSources.filter(item => item.kind === "practice").length },
    { id: "fixture", label: "VeriPoC fixture", count: 1 },
  ];
  const visibleBounties = (category === "all" || category === "bounties") ? bounties.filter(item => matches(`${item.title} ${item.description} ${item.ecosystems.join(" ")}`)) : [];
  const visiblePrograms = (category === "all" || category === "programs") ? programs.filter(item => matches(`${item.name} ${item.chain} ${item.sourceRevision}`)) : [];
  const showVault = (category === "all" || category === "fixture") && matches("Demo Vault Audit Program ERC-4626 local fixture VeriPoC Ethereum EVM");
  const visibleSources = publicSources.filter(item =>
    (category === "all" || category === "source" && item.kind === "protocol" || category === "practice" && item.kind === "practice") &&
    matches(`${item.title} ${item.owner} ${item.description} ${item.repository} ${item.ecosystem}`));
  const count = visibleBounties.length + visiblePrograms.length + Number(showVault) + visibleSources.length;

  return <main id="main" className="site-shell directory-page">
    <section className="directory-hero" aria-labelledby="directory-title"><h1 id="directory-title">Opportunities</h1><p>Browse published bug bounty programs, public source references, and VeriPoC&apos;s reviewed local vault fixture.</p></section>
    <div className="directory-content">
      <p className="directory-catalog-note">External programs are hosted by their owners on Immunefi. Read the current rules there and submit reports through the official program. VeriPoC runs only the local vault fixture.</p>
      <div className="directory-tabs" role="group" aria-label="Opportunity category">
        {categories.map(item => <button key={item.id} type="button" className="focus-ring" aria-pressed={category === item.id} onClick={() => setCategory(item.id)}>{item.label} <span>{item.count}</span></button>)}
      </div>
      <label className="directory-search"><Search size={17} aria-hidden="true" /><span className="sr-only">Search opportunities</span><input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Search opportunities" /></label>
      <p className="directory-result-count" aria-live="polite">Showing {count} {count === 1 ? "entry" : "entries"}</p>
      <div className="directory-list" aria-live="polite">
        {visibleBounties.map(item => <Link key={item.id} href={`/opportunities/${item.id}`} className="directory-row directory-bounty focus-ring" aria-label={`View ${item.title} bounty summary`}>
          <div className="directory-row-main"><span className="directory-mark directory-bounty-mark" aria-hidden="true"><Image src={item.logo} width={40} height={40} alt="" className="directory-project-logo" /></span><div><strong>{item.title}</strong><small>{item.description}</small></div><span className="directory-reward">{item.maximumReward}<small>Published maximum</small></span></div>
          <div className="directory-row-foot"><span>Bug bounty · Immunefi</span>{item.ecosystems.map(network => <NetworkBadge key={network} ecosystem={network} />)}<span>Read official terms before testing</span><span className="directory-date">View scope <ArrowRight size={16} aria-hidden="true" /></span></div>
        </Link>)}
        {visibleBounties.length > 0 && <TeamPromo />}
        {visiblePrograms.map(item => <Link key={item.id} href={`/programs/${item.id}`} className="directory-row directory-bounty focus-ring" aria-label={`Open ${item.name} public VeriPoC program`}><div className="directory-row-main"><span className="directory-mark"><BrandMark size={30} /></span><div><strong>{item.name}</strong><small>Public VeriPoC scope · {item.chain}</small></div><span className="directory-reward">Program scope<small>{item.verification}</small></span></div><div className="directory-row-foot"><span>Public program</span><span>Revision {item.sourceRevision.slice(0, 12)}</span><span>Report intake not configured</span><span className="directory-date">View scope <ArrowRight size={16} aria-hidden="true" /></span></div></Link>)}
        {showVault && <Link href="/opportunities/demo-vault" className="directory-row directory-live focus-ring" aria-label="Open Demo Vault Audit Program details">
          <div className="directory-row-main"><span className="directory-mark"><BrandMark size={30} /></span><div><strong>Demo Vault Audit Program</strong><small>VeriPoC reviewed synthetic fixture</small></div><span className="directory-reward">No bounty<small>Runnable locally</small></span></div>
          <div className="directory-row-foot"><span>PoC verification</span><span className="directory-badge"><CheckCircle2 size={14} aria-hidden="true" /> Runnable fixture</span><NetworkBadge ecosystem="ethereum" /><span>ERC-4626-style vault</span><span className="directory-date">View fixture <ArrowRight size={16} aria-hidden="true" /></span></div>
        </Link>}
        {visibleSources.map(item => <SourceRow key={item.id} source={item} />)}
        {count === 0 && <div className="directory-empty" role="status"><h2>No matching entries</h2><p>Try another search or category.</p></div>}
      </div>
      <p className="directory-limit">Published maximum rewards and scope summaries were checked on 17 November 2026 and may change. Immunefi&apos;s current program pages govern eligibility, authorization, testing and disclosure. External programs have no VeriPoC submission or verification integration.</p>
    </div>
  </main>;
}
