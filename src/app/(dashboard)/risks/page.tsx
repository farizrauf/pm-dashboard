import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Header } from "@/components/layout/header";
import { RisksClient } from "@/components/risks/risks-client";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Risks" };
export const revalidate = 30;

export default async function RisksPage() {
  const session = await auth();
  const userId = session!.user!.id!;
  const userProjects = { OR: [{ creatorId: userId }, { members: { some: { userId } } }] };

  const [risks, projects] = await Promise.all([
    prisma.risk.findMany({
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
      <Header title="Risks" description={`${risks.length} risk${risks.length !== 1 ? "s" : ""} tracked`} />
      <div className="flex-1 p-6 overflow-auto">
        <RisksClient risks={risks} projects={projects} />
      </div>
    </div>
  );
}
