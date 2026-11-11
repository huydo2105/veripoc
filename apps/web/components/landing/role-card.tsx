import Link from "next/link";
import { ArrowUpRight, Building2, ScanSearch } from "lucide-react";

type Role = "team" | "researcher";
const roles = {
  team: {
    action: "I have a project to audit",
    description: "Define the scope, bring researchers in, and review evidence before deciding what to fix.",
    href: "/teams/start",
    Icon: Building2,
  },
  researcher: {
    action: "I want to audit",
    description: "Explore authorized programs, use your own agent, and back each finding with a reproducible PoC.",
    href: "/researchers/start",
    Icon: ScanSearch,
  },
} as const;

export function RoleCard({ role }: { role: Role }) {
  const { description, action, href, Icon } = roles[role];
  return (
    <Link href={href} data-testid="role-card" className="role-card focus-ring">
      <Icon size={20} className="text-forest" aria-hidden="true" />
      <div>
        <strong className="block font-semibold tracking-tight">{action}</strong>
        <span className="mt-1 block text-sm text-muted">{description}</span>
      </div>
      <ArrowUpRight size={18} className="self-start text-forest" aria-hidden="true" />
    </Link>
  );
}
