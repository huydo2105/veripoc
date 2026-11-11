import Image from "next/image";
import Link from "next/link";

export function Logo() {
  return <Link href="/" aria-label="VeriPoC home" className="focus-ring inline-flex h-11 w-11 items-center justify-center rounded-lg">
    <Image src="/brand/veripoc-mark.svg" width={40} height={40} alt="" aria-hidden="true" priority />
  </Link>;
}
