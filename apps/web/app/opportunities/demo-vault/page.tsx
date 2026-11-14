import type { Metadata } from "next";
import { RoleJourney } from "@/components/journeys/role-journey";

export const metadata: Metadata = { title: "Demo Vault Audit Program" };

export default function DemoVaultPage() { return <RoleJourney />; }
