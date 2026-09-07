import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Header } from "@/components/layout/header";
import { CalendarClient } from "@/components/calendar/calendar-client";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Calendar" };
export const revalidate = 30;

export default async function CalendarPage() {
  const session = await auth();
  const userId = session!.user!.id!;

  const [tasks, milestones] = await Promise.all([
    prisma.task.findMany({
      where: {
        dueDate: { not: null },
        project: {
          OR: [
            { creatorId: userId },
            { members: { some: { userId } } },
          ],
        },
      },
      select: {
        id: true,
        title: true,
        status: true,
        priority: true,
        dueDate: true,
        project: { select: { id: true, name: true, color: true } },
      },
      orderBy: { dueDate: "asc" },
    }),
    prisma.milestone.findMany({
      where: {
        dueDate: { not: null },
        project: {
          OR: [
            { creatorId: userId },
            { members: { some: { userId } } },
          ],
        },
      },
      select: {
        id: true,
        title: true,
        status: true,
        dueDate: true,
        project: { select: { id: true, name: true, color: true } },
      },
      orderBy: { dueDate: "asc" },
    }),
  ]);

  return (
    <div className="flex flex-col h-full">
      <Header title="Calendar" description="Task deadlines and milestones" />
      <div className="flex-1 p-6 overflow-auto">
        <CalendarClient tasks={tasks} milestones={milestones} />
      </div>
    </div>
  );
}
