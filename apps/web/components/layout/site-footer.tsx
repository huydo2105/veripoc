import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { BrandMark } from "@/components/brand/brand-mark";

export function SiteFooter() {
  return <footer className="site-footer-wrap"><div className="site-shell footer-grid">
    <div className="footer-brand"><Link href="/" className="footer-logo focus-ring" aria-label="Auditor home"><BrandMark size={38} /><span>Auditor</span></Link><p>Independent research. Reproducible evidence.</p></div>
    <nav aria-label="Explore Auditor" className="footer-column"><h2>Explore</h2><Link href="/#how-it-works">How it works</Link><Link href="/faq">FAQ</Link><Link href="/leaderboard">Leaderboard</Link><Link href="/get-started">Opportunities</Link><Link href="/opportunities/demo-vault">Demo vault program</Link></nav>
    <nav aria-label="For teams" className="footer-column"><h2>For teams</h2><Link href="/teams/new">Unsaved draft preview</Link><Link href="/opportunities/demo-vault">Review demo scope</Link></nav>
    <nav aria-label="Project links" className="footer-column"><h2>Project</h2><a href="/.well-known/agent-card.json">Agent Card #1067</a><a href="https://github.com/huydo2105/auditor">GitHub <ArrowUpRight size={14} aria-hidden="true" /></a></nav>
  </div></footer>;
}
