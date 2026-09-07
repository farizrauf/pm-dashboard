import { getTeamMembers } from "@/actions/team";
import { Header } from "@/components/layout/header";
import { TeamClient } from "@/components/team/team-client";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Team" };
export const revalidate = 60;

export default async function TeamPage() {
  const members = await getTeamMembers();

  return (
    <div className="flex flex-col h-full">
      <Header
        title="Team"
        description={`${members.length} member${members.length !== 1 ? "s" : ""} in your workspace`}
      />
      <div className="flex-1 p-6 overflow-auto">
        <TeamClient members={members} />
      </div>
    </div>
  );
}
