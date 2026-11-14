import type { Metadata } from "next";
import { ProgramDraft } from "@/components/journeys/program-draft";

export const metadata: Metadata = { title: "Draft a program" };

export default function TeamNewPage() { return <ProgramDraft />; }
