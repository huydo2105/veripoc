import type { Metadata } from "next";
import { OpportunityList } from "@/components/opportunities/opportunity-list";

export const metadata: Metadata = { title: "Opportunities" };

export default function GetStartedPage() { return <OpportunityList />; }
