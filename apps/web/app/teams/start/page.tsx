import type { Metadata } from "next";
import { RoleJourney } from "@/components/journeys/role-journey";

export const metadata: Metadata = { title: "For DeFi teams" };

export default function TeamStartPage() {
  return <RoleJourney role="team" />;
}
