"use server";

import { Prisma, ProjectStatus, Priority } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const projectSchema = z.object({
  name: z.string().min(1, "Project name is required").max(100),
  description: z.string().optional(),
  status: z.enum(["PLANNING", "ACTIVE", "ON_HOLD", "COMPLETED", "CANCELLED"]).default("PLANNING"),
  priority: z.enum(["CRITICAL", "HIGH", "MEDIUM", "LOW"]).default("MEDIUM"),
  startDate: z.string().optional().nullable(),
  dueDate: z.string().optional().nullable(),
  color: z.string().default("#B4ABF4"),
});

export type ProjectFormData = z.infer<typeof projectSchema>;

export async function createProject(data: ProjectFormData) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const parsed = projectSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.errors[0].message };
  }

  const { startDate, dueDate, ...rest } = parsed.data;

  const project = await prisma.project.create({
    data: {
      ...rest,
      startDate: startDate ? new Date(startDate) : null,
      dueDate: dueDate ? new Date(dueDate) : null,
      creatorId: session.user.id,
      members: {
        create: {
          userId: session.user.id,
          role: "OWNER",
        },
      },
    },
  });

  await prisma.activity.create({
    data: {
      action: "project_created",
      description: `Created project ${project.name}`,
      userId: session.user.id,
      projectId: project.id,
    },
  });

  revalidatePath("/projects");
  revalidatePath("/dashboard");

  return { success: true, project };
}

export async function updateProject(id: string, data: ProjectFormData) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const parsed = projectSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.errors[0].message };
  }

  const { startDate, dueDate, ...rest } = parsed.data;

  const project = await prisma.project.update({
    where: { id },
    data: {
      ...rest,
      startDate: startDate ? new Date(startDate) : null,
      dueDate: dueDate ? new Date(dueDate) : null,
    },
  });

  revalidatePath("/projects");
  revalidatePath(`/projects/${id}`);
  revalidatePath("/dashboard");

  return { success: true, project };
}

export async function deleteProject(id: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await prisma.project.delete({ where: { id } });

  revalidatePath("/projects");
  revalidatePath("/dashboard");

  return { success: true };
}

export async function getProjects({
  search,
  status,
  priority,
  page = 1,
  limit = 12,
}: {
  search?: string;
  status?: string;
  priority?: string;
  page?: number;
  limit?: number;
} = {}) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const baseWhere: Prisma.ProjectWhereInput = {
    OR: [
      { creatorId: session.user.id },
      { members: { some: { userId: session.user.id } } },
    ],
  };

  const filters: Prisma.ProjectWhereInput[] = [];

  if (search) {
    filters.push({
      OR: [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ],
    });
  }
  if (status && status !== "ALL") {
    filters.push({ status: status as ProjectStatus });
  }
  if (priority && priority !== "ALL") {
    filters.push({ priority: priority as Priority });
  }

  const where: Prisma.ProjectWhereInput =
    filters.length > 0 ? { AND: [baseWhere, ...filters] } : baseWhere;

  const [projects, total] = await Promise.all([
    prisma.project.findMany({
      where,
      include: {
        members: {
          include: { user: { select: { id: true, name: true, image: true } } },
          take: 5,
        },
        tasks: {
          select: { id: true, status: true },
        },
        _count: { select: { tasks: true, milestones: true } },
      },
      orderBy: { updatedAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.project.count({ where }),
  ]);

  return { projects, total, pages: Math.ceil(total / limit) };
}

export async function getProject(id: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  return prisma.project.findFirst({
    where: {
      id,
      OR: [
        { creatorId: session.user.id },
        { members: { some: { userId: session.user.id } } },
      ],
    },
    include: {
      creator: { select: { id: true, name: true, image: true } },
      members: {
        include: { user: { select: { id: true, name: true, image: true, email: true } } },
      },
      tasks: {
        include: {
          assignee: { select: { id: true, name: true, image: true } },
          labels: { include: { label: true } },
        },
        orderBy: { position: "asc" },
      },
      milestones: { orderBy: { dueDate: "asc" } },
      activities: {
        include: { user: { select: { id: true, name: true, image: true } } },
        orderBy: { createdAt: "desc" },
        take: 20,
      },
      risks: { orderBy: { createdAt: "desc" } },
      issues: { orderBy: { createdAt: "desc" } },
      _count: { select: { tasks: true, milestones: true } },
    },
  });
}
