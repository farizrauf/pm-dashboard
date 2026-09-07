"use server";

import { Prisma, TaskStatus, Priority as PriorityEnum } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const taskSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().optional().nullable(),
  status: z.enum(["BACKLOG", "TODO", "IN_PROGRESS", "REVIEW", "DONE"]).default("TODO"),
  priority: z.enum(["CRITICAL", "HIGH", "MEDIUM", "LOW"]).default("MEDIUM"),
  projectId: z.string().optional().nullable(),
  assigneeId: z.string().optional().nullable(),
  dueDate: z.string().optional().nullable(),
  labelIds: z.array(z.string()).optional(),
});

export type TaskFormData = z.infer<typeof taskSchema>;

export async function createTask(data: TaskFormData) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const parsed = taskSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.errors[0].message };
  }

  const { dueDate, labelIds, ...rest } = parsed.data;

  // Get max position in the column
  const maxPosition = await prisma.task.aggregate({
    where: { projectId: rest.projectId, status: rest.status },
    _max: { position: true },
  });

  const task = await prisma.task.create({
    data: {
      ...rest,
      dueDate: dueDate ? new Date(dueDate) : null,
      creatorId: session.user.id,
      position: (maxPosition._max.position ?? 0) + 1,
      labels: labelIds?.length
        ? { create: labelIds.map((id) => ({ labelId: id })) }
        : undefined,
    },
    include: {
      assignee: { select: { id: true, name: true, image: true } },
      labels: { include: { label: true } },
    },
  });

  if (rest.projectId) {
    await prisma.activity.create({
      data: {
        action: "task_created",
        description: `Created task: ${task.title}`,
        userId: session.user.id,
        projectId: rest.projectId,
        taskId: task.id,
      },
    });
  }

  revalidatePath("/tasks");
  if (rest.projectId) {
    revalidatePath(`/projects/${rest.projectId}`);
  }
  revalidatePath("/dashboard");

  return { success: true, task };
}

export async function updateTask(id: string, data: Partial<TaskFormData>) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const { dueDate, labelIds, ...rest } = data;

  const prevTask = await prisma.task.findUnique({ where: { id } });

  const task = await prisma.task.update({
    where: { id },
    data: {
      ...rest,
      dueDate: dueDate !== undefined ? (dueDate ? new Date(dueDate) : null) : undefined,
      completedAt: rest.status === "DONE" && prevTask?.status !== "DONE"
        ? new Date()
        : rest.status !== "DONE" && prevTask?.status === "DONE"
        ? null
        : undefined,
      ...(labelIds !== undefined && {
        labels: {
          deleteMany: {},
          create: labelIds.map((lid) => ({ labelId: lid })),
        },
      }),
    },
    include: {
      assignee: { select: { id: true, name: true, image: true } },
      labels: { include: { label: true } },
    },
  });

  if (rest.status && rest.status !== prevTask?.status && task.projectId) {
    await prisma.activity.create({
      data: {
        action: "task_status_changed",
        description: `Moved task '${task.title}' to ${rest.status}`,
        userId: session.user.id,
        projectId: task.projectId,
        taskId: task.id,
      },
    });
  }

  revalidatePath("/tasks");
  if (task.projectId) {
    revalidatePath(`/projects/${task.projectId}`);
  }
  revalidatePath("/dashboard");

  return { success: true, task };
}

export async function deleteTask(id: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const task = await prisma.task.delete({
    where: { id },
    select: { projectId: true },
  });

  revalidatePath("/tasks");
  if (task.projectId) revalidatePath(`/projects/${task.projectId}`);
  revalidatePath("/dashboard");

  return { success: true };
}

export async function updateTaskPositions(
  tasks: { id: string; status: string; position: number }[]
) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  // Use transaction for atomic batch update (much faster than N individual queries)
  await prisma.$transaction(
    tasks.map((t) =>
      prisma.task.update({
        where: { id: t.id },
        data: { status: t.status as TaskStatus, position: t.position },
      })
    )
  );

  revalidatePath("/tasks");
  revalidatePath("/projects");

  return { success: true };
}

export async function getTasks({
  projectId,
  assigneeId,
  status,
  priority,
  search,
  page = 1,
  limit = 20,
}: {
  projectId?: string;
  assigneeId?: string;
  status?: string;
  priority?: string;
  search?: string;
  page?: number;
  limit?: number;
} = {}) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const where: Prisma.TaskWhereInput = {};

  if (projectId) where.projectId = projectId;
  if (assigneeId) where.assigneeId = assigneeId;
  if (status && status !== "ALL") where.status = status as TaskStatus;
  if (priority && priority !== "ALL") where.priority = priority as PriorityEnum;
  if (search) {
    where.title = { contains: search, mode: "insensitive" };
  }

  const [tasks, total] = await Promise.all([
    prisma.task.findMany({
      where,
      include: {
        assignee: { select: { id: true, name: true, image: true } },
        project: { select: { id: true, name: true, color: true } },
        labels: { include: { label: true } },
        _count: { select: { comments: true } },
      },
      orderBy: [{ position: "asc" }, { createdAt: "desc" }],
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.task.count({ where }),
  ]);

  return { tasks, total, pages: Math.ceil(total / limit) };
}

export async function addComment(taskId: string, content: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  if (!content.trim()) return { error: "Comment cannot be empty" };

  const comment = await prisma.comment.create({
    data: {
      content: content.trim(),
      taskId,
      authorId: session.user.id,
    },
    include: {
      author: { select: { id: true, name: true, image: true } },
    },
  });

  const task = await prisma.task.findUnique({ where: { id: taskId }, select: { projectId: true } });
  if (task?.projectId) {
    revalidatePath(`/projects/${task.projectId}`);
  }
  revalidatePath("/tasks");

  return { success: true, comment };
}

// ─── Bulk Actions ─────────────────────────────────────────────────────────────

export async function bulkDeleteTasks(ids: string[]) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  if (!ids.length) return { success: true, count: 0 };

  // Get unique projectIds before deletion for revalidation
  const tasks = await prisma.task.findMany({
    where: { id: { in: ids } },
    select: { projectId: true },
  });
  const projectIds = [...new Set(tasks.map((t) => t.projectId).filter(Boolean))] as string[];

  await prisma.task.deleteMany({ where: { id: { in: ids } } });

  revalidatePath("/tasks");
  revalidatePath("/dashboard");
  projectIds.forEach((pid) => revalidatePath(`/projects/${pid}`));

  return { success: true, count: ids.length };
}

export async function bulkUpdateTasks(
  ids: string[],
  data: { status?: string; priority?: string; assigneeId?: string | null }
) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  if (!ids.length) return { success: true, count: 0 };

  // Build scalar-only update (updateMany only handles scalar fields, not relations)
  type ScalarUpdate = {
    status?: TaskStatus;
    priority?: PriorityEnum;
    completedAt?: Date | null;
  };
  const scalarData: ScalarUpdate = {};
  if (data.status) scalarData.status = data.status as TaskStatus;
  if (data.priority) scalarData.priority = data.priority as PriorityEnum;
  if (data.status === "DONE") scalarData.completedAt = new Date();
  else if (data.status && data.status !== "DONE") scalarData.completedAt = null;

  // If assigneeId is included, we need per-row updates (relation field)
  if (data.assigneeId !== undefined) {
    await prisma.$transaction(
      ids.map((id) =>
        prisma.task.update({
          where: { id },
          data: {
            ...scalarData,
            assigneeId: data.assigneeId,
          },
        })
      )
    );
  } else if (Object.keys(scalarData).length > 0) {
    await prisma.task.updateMany({
      where: { id: { in: ids } },
      data: scalarData,
    });
  }

  // Get affected projects for revalidation
  const tasks = await prisma.task.findMany({
    where: { id: { in: ids } },
    select: { projectId: true },
  });
  const projectIds = [...new Set(tasks.map((t) => t.projectId).filter(Boolean))] as string[];

  revalidatePath("/tasks");
  revalidatePath("/dashboard");
  projectIds.forEach((pid) => revalidatePath(`/projects/${pid}`));

  return { success: true, count: ids.length };
}
