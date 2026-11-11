import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

// Small shadcn-style card primitive; kept local so page structure stays reviewable.
export function Card({ className, as: Comp = "div", ...props }: HTMLAttributes<HTMLElement> & { as?: "div" | "section" }) {
  return <Comp data-slot="card" className={cn("rounded-[14px] border border-line bg-surface", className)} {...props} />;
}
