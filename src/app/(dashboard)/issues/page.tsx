import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Header } from "@/components/layout/header";
import { IssuesClient } from "@/components/issues/issues-client";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Issues" };
export const revalidate = 30;

export default async function IssuesPage() {
  const session = await auth();
  const userId = session!.user!.id!;
  const userProjects = { OR: [{ creatorId: userId }, { members: { some: { userId } } }] };

  const [issues, projects] = await Promise.all([
    prisma.issue.findMany({
      where: { project: userProjects },
      include: { project: { select: { id: true, name: true, color: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.project.findMany({
      where: userProjects,
      select: { id: true, name: true, color: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div className="flex flex-col h-full">
      <Header title="Issues" description={`${issues.length} issue${issues.length !== 1 ? "s" : ""} tracked`} />
      <div className="flex-1 p-6 overflow-auto">
        <IssuesClient issues={issues} projects={projects} />
      </div>
    </div>
  );
}
