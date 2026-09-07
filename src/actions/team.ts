"use server";

import { TaskStatus, ProjectStatus } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function getTeamMembers() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const userId = session.user.id;

  const members = await prisma.user.findMany({
    where: {
      projectMembers: {
        some: {
          project: {
            OR: [
              { creatorId: userId },
              { members: { some: { userId } } },
            ],
          },
        },
      },
    },
    include: {
      assignedTasks: {
        where: { status: { not: TaskStatus.DONE } },
        select: { id: true, status: true, priority: true, projectId: true },
      },
      projectMembers: {
        include: {
          project: { select: { id: true, name: true, status: true, color: true } },
        },
      },
    },
  });

  return members.map((m) => ({
    id: m.id,
    name: m.name,
    email: m.email,
    image: m.image,
    role: m.role,
    activeTasks: m.assignedTasks.length,
    activeProjects: m.projectMembers.filter((pm) => pm.project.status === ProjectStatus.ACTIVE).length,
    projects: m.projectMembers.map((pm) => pm.project),
  }));
}
