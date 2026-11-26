import Link from "next/link";
import { BrandMark } from "@/components/brand/brand-mark";

export function Logo() {
  return <Link href="/" aria-label="Auditor home" className="focus-ring inline-flex h-12 w-12 items-center justify-center rounded-lg">
    <BrandMark size={48} />
  </Link>;
}
