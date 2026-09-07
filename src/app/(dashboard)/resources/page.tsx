import { auth } from "@/lib/auth";
import { Header } from "@/components/layout/header";
import { ResourcesClient } from "@/components/resources/resources-client";
import { getResourceData } from "@/actions/resources";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Resources" };
export const revalidate = 30;

export default async function ResourcesPage() {
  await auth();
  const { projects, members, allocations } = await getResourceData();

  return (
    <div className="flex flex-col h-full">
      <Header
        title="Resources"
        description={`${members.length} member${members.length !== 1 ? "s" : ""} · ${allocations.length} allocation${allocations.length !== 1 ? "s" : ""}`}
      />
      <div className="flex-1 p-6 overflow-auto">
        <ResourcesClient members={members} projects={projects} allocations={allocations} />
      </div>
    </div>
  );
}
