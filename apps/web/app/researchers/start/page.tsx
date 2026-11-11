import type { Metadata } from "next";
import { RoleJourney } from "@/components/journeys/role-journey";

export const metadata: Metadata = { title: "For researchers" };

export default function ResearcherStartPage() {
  return <RoleJourney role="researcher" />;
}
