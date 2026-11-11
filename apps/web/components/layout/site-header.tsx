import Link from "next/link";
import { Logo } from "@/components/brand/logo";

export function SiteHeader() {
  return <header className="border-b border-line bg-surface">
    <div className="mx-auto flex w-full max-w-[1160px] flex-wrap items-center justify-between gap-x-6 gap-y-1 px-5 py-3 md:px-6">
      <Logo />
      <nav aria-label="Main navigation" className="flex flex-wrap items-center gap-x-5 gap-y-1 text-sm font-medium text-ink">
        <Link className="focus-ring rounded py-2 hover:text-forest" href="/#how-it-works">How it works</Link>
        <Link className="focus-ring rounded py-2 hover:text-forest" href="/teams/start">For teams</Link>
        <Link className="focus-ring rounded py-2 hover:text-forest" href="/researchers/start">For researchers</Link>
        <Link className="focus-ring rounded py-2 hover:text-forest" href="/verify">Demo</Link>
      </nav>
    </div>
  </header>;
}
