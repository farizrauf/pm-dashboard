import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Header } from "@/components/layout/header";
import { MilestonesClient } from "@/components/milestones/milestones-client";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Milestones" };
export const revalidate = 30;

export default async function MilestonesPage() {
  const session = await auth();
  const userId = session!.user!.id!;

  const userProjects = {
    OR: [
      { creatorId: userId },
      { members: { some: { userId } } },
    ],
  };

  const [milestones, projects] = await Promise.all([
    prisma.milestone.findMany({
      where: { project: userProjects },
      include: { project: { select: { id: true, name: true, color: true } } },
      orderBy: { dueDate: "asc" },
    }),
    prisma.project.findMany({
      where: userProjects,
      select: { id: true, name: true, color: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div className="flex flex-col h-full">
      <Header title="Milestones" description={`${milestones.length} milestone${milestones.length !== 1 ? "s" : ""} across all projects`} />
      <div className="flex-1 p-6 overflow-auto">
        <MilestonesClient milestones={milestones} projects={projects} />
      </div>
    </div>
  );
}
