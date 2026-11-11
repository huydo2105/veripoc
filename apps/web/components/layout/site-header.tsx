import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Logo } from "@/components/brand/logo";

export function SiteHeader() {
  return (
    <header className="site-shell">
      <div className="site-header">
        <Logo />
        <nav aria-label="Main navigation" className="site-nav">
          <Link className="site-nav-link focus-ring" href="/workflow">Workflow</Link>
          <Link className="site-nav-link focus-ring" href="/teams/start">Teams</Link>
          <Link className="site-nav-link focus-ring" href="/researchers/start">Researchers</Link>
        </nav>
        <Link className="site-action site-action-dark focus-ring" href="/verify">
          Verify PoC <ArrowUpRight size={15} aria-hidden="true" />
        </Link>
      </div>
    </header>
  );
}
