import Link from "next/link";
import { FolderOpen, FileText } from "lucide-react";
import type { ReactNode } from "react";

export function ProfileShell({ active, children }: { active: "projects" | "findings"; children: ReactNode }) {
  return <main id="main" className="site-shell profile-page">
    <div className="section-head"><h1>Profile</h1><p>Your authorized projects and findings.</p></div>
    <div className="profile-layout">
      <nav aria-label="Profile sections" className="profile-nav">
        <Link href="/profile/projects" aria-current={active === "projects" ? "page" : undefined} className="focus-ring"><FolderOpen size={17} aria-hidden="true" /> Our projects</Link>
        <Link href="/profile/findings" aria-current={active === "findings" ? "page" : undefined} className="focus-ring"><FileText size={17} aria-hidden="true" /> Our findings</Link>
      </nav>
      <section className="profile-content">{children}</section>
    </div>
  </main>;
}
