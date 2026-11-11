import { ArrowUpRight } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="site-shell">
      <div className="site-footer">
        <p><strong className="mr-2 text-ink">VeriPoC</strong> Smart-contract security evidence</p>
        <nav aria-label="Footer navigation" className="flex flex-wrap items-center gap-x-5 gap-y-2">
          <a className="site-nav-link focus-ring" href="/.well-known/agent-card.json">Concordium Agent #1067</a>
          <a className="site-nav-link focus-ring inline-flex items-center gap-1" href="https://github.com/huydo2105/veripoc">
            GitHub <ArrowUpRight size={14} aria-hidden="true" />
          </a>
        </nav>
      </div>
    </footer>
  );
}
