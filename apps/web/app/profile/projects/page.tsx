import type { Metadata } from "next";
import { ProfileShell } from "@/components/profile/profile-shell";
import { SavedPrograms } from "@/components/journeys/saved-programs";

export const metadata: Metadata = { title: "Our projects" };
export default function ProjectsPage() { return <ProfileShell active="projects"><h2>Our projects</h2><p>Programs you own or have been invited to view.</p><SavedPrograms embedded /></ProfileShell>; }
