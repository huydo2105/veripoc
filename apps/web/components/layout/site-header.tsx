import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { ThemeToggle } from "@/components/layout/theme-toggle";

export function SiteHeader() {
  return (
    <header className="site-shell">
      <div className="site-header">
        <Logo />
        <nav aria-label="Main navigation" className="site-nav">
          <Link className="site-nav-link focus-ring" href="/leaderboard">Leaderboard</Link>
          <Link className="site-nav-link focus-ring" href="/get-started">Opportunities</Link>
        </nav>
        <ThemeToggle />
      </div>
    </header>
  );
}
