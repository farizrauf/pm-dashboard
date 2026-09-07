import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Header } from "@/components/layout/header";
import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Reports" };
export const revalidate = 60;

const ReportsClient = dynamic(
  () => import("@/components/reports/reports-client").then((m) => ({ default: m.ReportsClient })),
  {
    ssr: false,
    loading: () => (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-5 space-y-3">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-[200px] w-full rounded-lg" />
          </div>
        ))}
      </div>
    ),
  }
);

export default async function ReportsPage() {
  const session = await auth();
  const userId = session!.user!.id!;

  const projectFilter = {
    OR: [
      { creatorId: userId },
      { members: { some: { userId } } },
    ],
  };

  const [
    projects,
    tasksByStatus,
    tasksByPriority,
    overdueTasks,
    completionByProject,
    teamWorkload,
    completedLast30,
    createdLast30,
  ] = await Promise.all([
    // All projects
    prisma.project.findMany({
      where: projectFilter,
      include: {
        tasks: { select: { id: true, status: true, priority: true } },
        members: { select: { userId: true } },
      },
      orderBy: { updatedAt: "desc" },
    }),

    // Tasks by status
    prisma.task.groupBy({
      by: ["status"],
      where: { project: projectFilter },
      _count: { id: true },
    }),

    // Tasks by priority
    prisma.task.groupBy({
      by: ["priority"],
      where: { project: projectFilter },
      _count: { id: true },
    }),

    // Overdue tasks
    prisma.task.findMany({
      where: {
        dueDate: { lt: new Date() },
        status: { not: "DONE" },
        project: projectFilter,
      },
      include: {
        project: { select: { id: true, name: true, color: true } },
        assignee: { select: { id: true, name: true, image: true } },
      },
      orderBy: { dueDate: "asc" },
    }),

    // Completion by project
    prisma.project.findMany({
      where: { ...projectFilter, status: { in: ["ACTIVE", "COMPLETED"] } },
      include: { tasks: { select: { id: true, status: true } } },
      orderBy: { updatedAt: "desc" },
      take: 8,
    }),

    // Team workload
    prisma.user.findMany({
      where: {
        projectMembers: { some: { project: projectFilter } },
      },
      include: {
        assignedTasks: {
          where: { status: { not: "DONE" }, project: projectFilter },
          select: { id: true, priority: true },
        },
      },
    }),

    // Tasks completed in last 30 days (daily)
    prisma.task.findMany({
      where: {
        status: "DONE",
        completedAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
        project: projectFilter,
      },
      select: { completedAt: true },
    }),

    // Tasks created in last 30 days (daily)
    prisma.task.findMany({
      where: {
        createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
        project: projectFilter,
      },
      select: { createdAt: true },
    }),
  ]);

  // Build daily activity data for last 30 days
  const activityData: Record<string, { created: number; completed: number }> = {};
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = `${d.getMonth() + 1}/${d.getDate()}`;
    activityData[key] = { created: 0, completed: 0 };
  }

  completedLast30.forEach(({ completedAt }) => {
    if (!completedAt) return;
    const d = new Date(completedAt);
    const key = `${d.getMonth() + 1}/${d.getDate()}`;
    if (activityData[key]) activityData[key].completed++;
  });
  createdLast30.forEach(({ createdAt }) => {
    const d = new Date(createdAt);
    const key = `${d.getMonth() + 1}/${d.getDate()}`;
    if (activityData[key]) activityData[key].created++;
  });

  // Thin out to every 3rd day for readability
  const dailyActivity = Object.entries(activityData)
    .filter((_, i) => i % 3 === 0)
    .map(([date, v]) => ({ date, ...v }));

  return (
    <div className="flex flex-col h-full">
      <Header title="Reports" description="Analytics and insights across all projects" />
      <div className="flex-1 p-6 overflow-auto">
        <ReportsClient
          projects={projects}
          tasksByStatus={tasksByStatus}
          tasksByPriority={tasksByPriority}
          overdueTasks={overdueTasks}
          completionByProject={completionByProject}
          teamWorkload={teamWorkload}
          dailyActivity={dailyActivity}
        />
      </div>
    </div>
  );
}
