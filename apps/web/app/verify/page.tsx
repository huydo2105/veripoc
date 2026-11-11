import type { Metadata } from "next";
import { VerificationConsole } from "@/components/verification/verification-console";

export const metadata: Metadata = { title: "Proof-of-Concept Verification" };

export default function VerifyPage() { return <VerificationConsole />; }
