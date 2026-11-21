import type { Metadata } from "next";
import Link from "next/link";
import { ProfileShell } from "@/components/profile/profile-shell";

export const metadata: Metadata = { title: "Our findings" };
export default function FindingsPage() { return <ProfileShell active="findings"><h2>Our findings</h2><p>No findings from new team programs yet. Private report intake and triage are planned in Issue #36.</p><Link href="/programs/demo-vault" className="site-action focus-ring">Open the reviewed Demo Vault journey</Link></ProfileShell>; }
