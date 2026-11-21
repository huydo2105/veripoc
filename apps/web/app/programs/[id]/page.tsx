import type { Metadata } from "next";
import { SavedPrograms } from "@/components/journeys/saved-programs";

export const metadata: Metadata = { title: "Authorized program" };
export default async function ProgramPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <SavedPrograms id={id} />;
}
