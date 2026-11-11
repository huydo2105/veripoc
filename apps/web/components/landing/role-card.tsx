import Link from "next/link";
import { ArrowRight, Building2, ScanSearch } from "lucide-react";
import { Card } from "@/components/ui/card";

type Role = "team" | "researcher";
const roles = {
  team: { audience: "DEFI TEAMS", title: "Audit my contract", description: "Define your audit scope, invite security researchers, and review reproducible vulnerability findings.", action: "I have a smart contract to audit", href: "/teams/start", Icon: Building2 },
  researcher: { audience: "SECURITY RESEARCHERS", title: "Find vulnerabilities", description: "Join authorized audit programs, bring your own AI agent, and submit findings backed by reproducible evidence.", action: "I want to audit", href: "/researchers/start", Icon: ScanSearch },
} as const;

export function RoleCard({ role }: { role: Role }) {
  const { audience, title, description, action, href, Icon } = roles[role];
  return <Link href={href} data-testid="role-card" className="focus-ring group block h-full rounded-[14px] no-underline">
    <Card className="flex h-full min-h-[300px] flex-col p-6 transition-colors group-hover:border-forest md:p-8">
      <span className="mb-7 inline-flex h-11 w-11 items-center justify-center rounded-lg border border-[#c9dfd0] bg-forest-soft text-forest"><Icon size={22} aria-hidden="true" /></span>
      <span className="mb-2 text-xs font-semibold tracking-[.09em] text-muted">{audience}</span>
      <strong className="mb-3 text-2xl tracking-tight text-ink">{title}</strong>
      <span className="max-w-[40ch] text-[15px] leading-relaxed text-muted">{description}</span>
      <span className="mt-auto inline-flex items-center gap-2 pt-7 text-sm font-semibold text-forest">{action}<ArrowRight size={17} aria-hidden="true" /></span>
    </Card>
  </Link>;
}
