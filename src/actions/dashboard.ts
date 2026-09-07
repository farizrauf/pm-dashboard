"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { unstable_cache } from "next/cache";

async function fetchDashboardStats(uid: string) {
  const [
    activeProjects,
    totalTasks,
    completedTasks,
    overdueTasks,
    recentActivity,
    upcomingDeadlines,
    teamWorkload,
    projectsWithProgress,
    tasksByStatus,
  ] = await Promise.all([
    // Active projects count
    prisma.project.count({
      where: {
        status: "ACTIVE",
        OR: [
          { creatorId: uid },
          { members: { some: { userId: uid } } },
        ],
      },
    }),

    // Total tasks
    prisma.task.count({
      where: {
        project: {
          OR: [
            { creatorId: uid },
            { members: { some: { userId: uid } } },
          ],
        },
      },
    }),

    // Completed tasks
    prisma.task.count({
      where: {
        status: "DONE",
        project: {
          OR: [
            { creatorId: uid },
            { members: { some: { userId: uid } } },
          ],
        },
      },
    }),

    // Overdue tasks
    prisma.task.count({
      where: {
        dueDate: { lt: new Date() },
        status: { not: "DONE" },
        project: {
          OR: [
            { creatorId: uid },
            { members: { some: { userId: uid } } },
          ],
        },
      },
    }),

    // Recent activity
    prisma.activity.findMany({
      where: {
        OR: [
          { userId: uid },
          {
            project: {
              OR: [
                { creatorId: uid },
                { members: { some: { userId: uid } } },
              ],
            },
          },
        ],
      },
      include: {
        user: { select: { id: true, name: true, image: true } },
        project: { select: { id: true, name: true } },
        task: { select: { id: true, title: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),

    // Upcoming deadlines (tasks due in next 14 days)
    prisma.task.findMany({
      where: {
        dueDate: {
          gte: new Date(),
          lte: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        },
        status: { not: "DONE" },
        project: {
          OR: [
            { creatorId: uid },
            { members: { some: { userId: uid } } },
          ],
        },
      },
      include: {
        project: { select: { id: true, name: true, color: true } },
        assignee: { select: { id: true, name: true, image: true } },
      },
      orderBy: { dueDate: "asc" },
      take: 5,
    }),

    // Team workload
    prisma.user.findMany({
      where: {
        projectMembers: {
          some: {
            project: {
              OR: [
                { creatorId: uid },
                { members: { some: { userId: uid } } },
              ],
            },
          },
        },
      },
      include: {
        assignedTasks: {
          where: { status: { not: "DONE" } },
          select: { id: true, status: true, priority: true },
        },
      },
      take: 6,
    }),

    // Projects with progress
    prisma.project.findMany({
      where: {
        status: { in: ["ACTIVE", "PLANNING"] },
        OR: [
          { creatorId: uid },
          { members: { some: { userId: uid } } },
        ],
      },
      include: {
        tasks: { select: { id: true, status: true } },
        members: {
          include: { user: { select: { id: true, name: true, image: true } } },
          take: 4,
        },
      },
      orderBy: { updatedAt: "desc" },
      take: 6,
    }),

    // Tasks by status for chart
    prisma.task.groupBy({
      by: ["status"],
      where: {
        project: {
          OR: [
            { creatorId: uid },
            { members: { some: { userId: uid } } },
          ],
        },
      },
      _count: { _all: true },
    }),
  ]);

  const overallProgress = totalTasks > 0
    ? Math.round((completedTasks / totalTasks) * 100)
    : 0;

  return {
    kpis: {
      activeProjects,
      totalTasks,
      completedTasks,
      overallProgress,
      overdueTasks,
    },
    recentActivity,
    upcomingDeadlines,
    teamWorkload: teamWorkload.map((member) => ({
      ...member,
      taskCount: member.assignedTasks.length,
    })),
    projectsWithProgress: projectsWithProgress.map((p) => {
      const done = p.tasks.filter((t) => t.status === "DONE").length;
      const total = p.tasks.length;
      return {
        ...p,
        progress: total > 0 ? Math.round((done / total) * 100) : 0,
        doneCount: done,
        totalCount: total,
      };
    }),
    tasksByStatus,
  };
}

export async function getDashboardStats() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const userId = session.user.id;

  // Cache per user, revalidate every 60 seconds
  const cachedFetch = unstable_cache(
    (uid: string) => fetchDashboardStats(uid),
    [`dashboard-stats-${userId}`],
    { revalidate: 60, tags: [`dashboard-${userId}`] }
  );

  return cachedFetch(userId);
}

async function fetchChartData(uid: string) {
  const eightWeeksAgo = new Date();
  eightWeeksAgo.setDate(eightWeeksAgo.getDate() - 56);

  const completedByWeek = await prisma.task.findMany({
    where: {
      status: "DONE",
      completedAt: { gte: eightWeeksAgo },
      project: {
        OR: [
          { creatorId: uid },
          { members: { some: { userId: uid } } },
        ],
      },
    },
    select: { completedAt: true },
  });

  const weekData: Record<string, number> = {};
  for (let i = 7; i >= 0; i--) {
    const key = `Week ${8 - i}`;
    weekData[key] = 0;
  }

  completedByWeek.forEach(({ completedAt }) => {
    if (!completedAt) return;
    const weeksAgo = Math.floor(
      (Date.now() - completedAt.getTime()) / (7 * 24 * 60 * 60 * 1000)
    );
    if (weeksAgo < 8) {
      const key = `Week ${8 - weeksAgo}`;
      weekData[key] = (weekData[key] ?? 0) + 1;
    }
  });

  return {
    completionTrend: Object.entries(weekData).map(([week, count]) => ({
      week,
      completed: count,
    })),
  };
}

export async function getChartData() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const userId = session.user.id;

  const cachedFetch = unstable_cache(
    (uid: string) => fetchChartData(uid),
    [`chart-data-${userId}`],
    { revalidate: 300, tags: [`dashboard-${userId}`] }
  );

  return cachedFetch(userId);
}
