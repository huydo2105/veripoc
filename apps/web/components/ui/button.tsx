import type { ButtonHTMLAttributes } from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const variants = cva("focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors disabled:opacity-50", {
  variants: {
    variant: {
      default: "bg-forest text-white hover:bg-forest-hover",
      outline: "border border-line bg-surface text-ink hover:border-forest hover:text-forest",
    },
  },
  defaultVariants: { variant: "default" },
});

type Props = ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof variants> & { asChild?: boolean };
export function Button({ className, variant, asChild = false, ...props }: Props) {
  const Comp = asChild ? Slot : "button";
  return <Comp data-slot="button" className={cn(variants({ variant }), className)} {...props} />;
}
