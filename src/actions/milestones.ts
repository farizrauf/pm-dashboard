"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const milestoneSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().optional().nullable(),
  status: z.enum(["PENDING", "IN_PROGRESS", "COMPLETED", "MISSED"]).default("PENDING"),
  dueDate: z.string().optional().nullable(),
});

export async function createMilestone(projectId: string, data: z.infer<typeof milestoneSchema>) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const parsed = milestoneSchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.errors[0].message };

  const { dueDate, ...rest } = parsed.data;

  const milestone = await prisma.milestone.create({
    data: {
      ...rest,
      dueDate: dueDate ? new Date(dueDate) : null,
      projectId,
    },
  });

  revalidatePath(`/projects/${projectId}`);
  return { success: true, milestone };
}

export async function updateMilestone(id: string, data: Partial<z.infer<typeof milestoneSchema>>) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const { dueDate, ...rest } = data;

  const milestone = await prisma.milestone.update({
    where: { id },
    data: {
      ...rest,
      dueDate: dueDate !== undefined ? (dueDate ? new Date(dueDate) : null) : undefined,
      completedAt: rest.status === "COMPLETED" ? new Date() : undefined,
    },
  });

  revalidatePath(`/projects/${milestone.projectId}`);
  return { success: true, milestone };
}

export async function deleteMilestone(id: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const ms = await prisma.milestone.delete({ where: { id } });
  revalidatePath(`/projects/${ms.projectId}`);
  return { success: true };
}

export async function getAllMilestones() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  const userId = session.user.id;

  return prisma.milestone.findMany({
    where: {
      project: {
        OR: [
          { creatorId: userId },
          { members: { some: { userId } } },
        ],
      },
    },
    include: {
      project: { select: { id: true, name: true, color: true } },
    },
    orderBy: { dueDate: "asc" },
  });
}
