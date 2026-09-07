"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const allocationSchema = z.object({
  userId: z.string().min(1),
  projectId: z.string().min(1),
  role: z.string().optional().nullable(),
  hoursPerWeek: z.coerce.number().min(0).max(168).default(0),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export type AllocationFormData = z.infer<typeof allocationSchema>;

export async function getResourceData() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  const userId = session.user.id;

  const userProjects = {
    OR: [{ creatorId: userId }, { members: { some: { userId } } }],
  };

  const [projects, members, allocations] = await Promise.all([
    prisma.project.findMany({
      where: userProjects,
      select: { id: true, name: true, color: true, status: true },
      orderBy: { name: "asc" },
    }),
    prisma.user.findMany({
      where: {
        projectMembers: { some: { project: userProjects } },
      },
      select: {
        id: true, name: true, email: true, image: true, role: true,
        assignedTasks: {
          where: { status: { not: "DONE" } },
          select: { id: true },
        },
      },
      orderBy: { name: "asc" },
    }),
    prisma.resourceAllocation.findMany({
      where: { project: userProjects },
      include: {
        user: { select: { id: true, name: true, image: true, email: true } },
        project: { select: { id: true, name: true, color: true } },
      },
    }),
  ]);

  return { projects, members, allocations };
}

export async function upsertAllocation(data: AllocationFormData) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  const parsed = allocationSchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.errors[0].message };

  const { userId, projectId, startDate, endDate, ...rest } = parsed.data;

  const allocation = await prisma.resourceAllocation.upsert({
    where: { userId_projectId: { userId, projectId } },
    create: {
      userId, projectId, ...rest,
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
    },
    update: {
      ...rest,
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
    },
  });

  revalidatePath("/resources");
  return { success: true, allocation };
}

export async function deleteAllocation(id: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  await prisma.resourceAllocation.delete({ where: { id } });
  revalidatePath("/resources");
  return { success: true };
}
