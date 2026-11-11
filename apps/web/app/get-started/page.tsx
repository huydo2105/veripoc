import type { Metadata } from "next";
import { RoleJourney } from "@/components/journeys/role-journey";

export const metadata: Metadata = { title: "Get started" };

export default function GetStartedPage() { return <RoleJourney role="researcher" />; }
