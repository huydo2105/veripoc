import type { Metadata } from "next";
import { FaqDirectory } from "@/components/landing/faq-directory";

export const metadata: Metadata = {
  title: "FAQ · Auditor",
  description: "Frequently asked questions about Auditor bug bounty setup, the 100 CCD deposit, Concordium agent badges, and isolated Foundry verification.",
};

export default function FaqPage() {
  return <FaqDirectory />;
}
