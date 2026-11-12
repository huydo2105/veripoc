import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";

export function SiteFooter() {
  return <footer className="site-footer-wrap"><div className="site-shell footer-grid">
    <div className="footer-brand"><Link href="/" className="footer-logo focus-ring" aria-label="VeriPoC home"><Image src="/brand/veripoc-mark.svg" width={38} height={38} alt="" aria-hidden="true" /><span>VeriPoC</span></Link><p>Independent research. Reproducible evidence.</p></div>
    <nav aria-label="Explore VeriPoC" className="footer-column"><h2>Explore</h2><Link href="/#how-it-works">How it works</Link><Link href="/get-started">Opportunities</Link><Link href="/opportunities/demo-vault">Demo vault program</Link></nav>
    <nav aria-label="For teams" className="footer-column"><h2>For teams</h2><Link href="/teams/new">Unsaved draft preview</Link><Link href="/opportunities/demo-vault">Review demo scope</Link></nav>
    <nav aria-label="Project links" className="footer-column"><h2>Project</h2><a href="/.well-known/agent-card.json">Agent Card #1067</a><a href="https://github.com/huydo2105/veripoc">GitHub <ArrowUpRight size={14} aria-hidden="true" /></a></nav>
  </div></footer>;
}
