"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import * as XLSX from "xlsx";

// ─── Export Tasks ─────────────────────────────────────────────────────────────

export async function exportTasksData(filters?: {
  status?: string;
  priority?: string;
  projectId?: string;
  search?: string;
}) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const where: Record<string, unknown> = {};
  if (filters?.status && filters.status !== "ALL") where.status = filters.status;
  if (filters?.priority && filters.priority !== "ALL") where.priority = filters.priority;
  if (filters?.projectId && filters.projectId !== "ALL") where.projectId = filters.projectId;
  if (filters?.search) {
    where.title = { contains: filters.search, mode: "insensitive" };
  }

  const tasks = await prisma.task.findMany({
    where,
    include: {
      assignee: { select: { name: true, email: true } },
      project: { select: { name: true } },
      labels: { include: { label: { select: { name: true } } } },
      creator: { select: { name: true, email: true } },
    },
    orderBy: [{ status: "asc" }, { priority: "asc" }, { createdAt: "desc" }],
    take: 5000,
  });

  const rows = tasks.map((t) => ({
    ID: t.id,
    Title: t.title,
    Description: t.description ?? "",
    Status: t.status,
    Priority: t.priority,
    Project: t.project?.name ?? "",
    Assignee: t.assignee?.name ?? "",
    "Assignee Email": t.assignee?.email ?? "",
    Creator: t.creator?.name ?? "",
    "Due Date": t.dueDate ? new Date(t.dueDate).toISOString().split("T")[0] : "",
    "Completed At": t.completedAt ? new Date(t.completedAt).toISOString().split("T")[0] : "",
    Labels: t.labels.map((l) => l.label.name).join(", "),
    "Created At": new Date(t.createdAt).toISOString().split("T")[0],
    "Updated At": new Date(t.updatedAt).toISOString().split("T")[0],
  }));

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(rows);

  // Auto-width columns
  const colWidths = Object.keys(rows[0] ?? {}).map((key) => ({
    wch: Math.max(key.length, ...rows.map((r) => String(r[key as keyof typeof r] ?? "").length), 10),
  }));
  ws["!cols"] = colWidths;

  XLSX.utils.book_append_sheet(wb, ws, "Tasks");
  const buffer = XLSX.write(wb, { type: "base64", bookType: "xlsx" });

  return { data: buffer, filename: `tasks-export-${Date.now()}.xlsx`, count: rows.length };
}

// ─── Export Projects ──────────────────────────────────────────────────────────

export async function exportProjectsData() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const userId = session.user.id;

  const projects = await prisma.project.findMany({
    where: {
      OR: [
        { creatorId: userId },
        { members: { some: { userId } } },
      ],
    },
    include: {
      creator: { select: { name: true, email: true } },
      members: { include: { user: { select: { name: true, email: true } } } },
      _count: { select: { tasks: true, milestones: true } },
      tasks: { select: { status: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  const rows = projects.map((p) => {
    const doneTasks = p.tasks.filter((t) => t.status === "DONE").length;
    const progress = p.tasks.length > 0 ? Math.round((doneTasks / p.tasks.length) * 100) : 0;
    return {
      ID: p.id,
      Name: p.name,
      Description: p.description ?? "",
      Status: p.status,
      Priority: p.priority,
      Progress: `${progress}%`,
      "Total Tasks": p._count.tasks,
      "Done Tasks": doneTasks,
      Milestones: p._count.milestones,
      Creator: p.creator.name ?? "",
      "Creator Email": p.creator.email ?? "",
      Members: p.members.map((m) => m.user.name).join(", "),
      "Start Date": p.startDate ? new Date(p.startDate).toISOString().split("T")[0] : "",
      "Due Date": p.dueDate ? new Date(p.dueDate).toISOString().split("T")[0] : "",
      "Created At": new Date(p.createdAt).toISOString().split("T")[0],
      "Updated At": new Date(p.updatedAt).toISOString().split("T")[0],
    };
  });

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(rows);
  const colWidths = Object.keys(rows[0] ?? {}).map((key) => ({
    wch: Math.max(key.length, ...rows.map((r) => String(r[key as keyof typeof r] ?? "").length), 10),
  }));
  ws["!cols"] = colWidths;
  XLSX.utils.book_append_sheet(wb, ws, "Projects");

  const buffer = XLSX.write(wb, { type: "base64", bookType: "xlsx" });
  return { data: buffer, filename: `projects-export-${Date.now()}.xlsx`, count: rows.length };
}

// ─── Export Users (admin only) ────────────────────────────────────────────────

export async function exportUsersData() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const currentUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });
  if (currentUser?.role !== "ADMIN") throw new Error("Forbidden");

  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      _count: { select: { assignedTasks: true, projectMembers: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const rows = users.map((u) => ({
    ID: u.id,
    Name: u.name ?? "",
    Email: u.email,
    Role: u.role,
    "Assigned Tasks": u._count.assignedTasks,
    Projects: u._count.projectMembers,
    "Created At": new Date(u.createdAt).toISOString().split("T")[0],
  }));

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(rows);
  const colWidths = Object.keys(rows[0] ?? {}).map((key) => ({
    wch: Math.max(key.length, ...rows.map((r) => String(r[key as keyof typeof r] ?? "").length), 10),
  }));
  ws["!cols"] = colWidths;
  XLSX.utils.book_append_sheet(wb, ws, "Users");

  const buffer = XLSX.write(wb, { type: "base64", bookType: "xlsx" });
  return { data: buffer, filename: `users-export-${Date.now()}.xlsx`, count: rows.length };
}

// ─── Import Tasks ─────────────────────────────────────────────────────────────

export type ImportTaskRow = {
  title: string;
  description?: string;
  status?: string;
  priority?: string;
  dueDate?: string;
  assigneeEmail?: string;
  projectName?: string;
};

export async function importTasksData(rows: ImportTaskRow[]) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const results: { row: number; status: "ok" | "error"; message?: string }[] = [];
  let successCount = 0;

  const validStatuses = ["BACKLOG", "TODO", "IN_PROGRESS", "REVIEW", "DONE"];
  const validPriorities = ["CRITICAL", "HIGH", "MEDIUM", "LOW"];

  // Pre-fetch all users and projects to avoid N+1 queries
  const [allUsers, allProjects] = await Promise.all([
    prisma.user.findMany({ select: { id: true, email: true } }),
    prisma.project.findMany({
      where: {
        OR: [
          { creatorId: session.user.id },
          { members: { some: { userId: session.user.id } } },
        ],
      },
      select: { id: true, name: true },
    }),
  ]);

  const userMap = new Map(allUsers.map((u) => [u.email.toLowerCase(), u.id]));
  const projectMap = new Map(allProjects.map((p) => [p.name.toLowerCase(), p.id]));

  // Get max position per status for ordering
  const positionCounters: Record<string, number> = {};

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    try {
      if (!row.title?.trim()) {
        results.push({ row: i + 1, status: "error", message: "Title is required" });
        continue;
      }

      const status = row.status
        ? validStatuses.includes(row.status.toUpperCase())
          ? row.status.toUpperCase()
          : "TODO"
        : "TODO";

      const priority = row.priority
        ? validPriorities.includes(row.priority.toUpperCase())
          ? row.priority.toUpperCase()
          : "MEDIUM"
        : "MEDIUM";

      let dueDate: Date | null = null;
      if (row.dueDate) {
        const d = new Date(row.dueDate);
        if (!isNaN(d.getTime())) dueDate = d;
      }

      const assigneeId = row.assigneeEmail
        ? userMap.get(row.assigneeEmail.toLowerCase()) ?? null
        : null;

      const projectId = row.projectName
        ? projectMap.get(row.projectName.toLowerCase()) ?? null
        : null;

      const position = (positionCounters[status] ?? 0);
      positionCounters[status] = position + 1;

      await prisma.task.create({
        data: {
          title: row.title.trim(),
          description: row.description?.trim() || null,
          status: status as "BACKLOG" | "TODO" | "IN_PROGRESS" | "REVIEW" | "DONE",
          priority: priority as "CRITICAL" | "HIGH" | "MEDIUM" | "LOW",
          dueDate,
          assigneeId,
          projectId,
          creatorId: session.user.id,
          position,
        },
      });

      results.push({ row: i + 1, status: "ok" });
      successCount++;
    } catch (err) {
      results.push({ row: i + 1, status: "error", message: String(err) });
    }
  }

  return { successCount, errorCount: rows.length - successCount, results };
}

// ─── Generate XLSX templates ──────────────────────────────────────────────────

export async function getTaskImportTemplate() {
  const sampleRows = [
    {
      title: "Example Task 1",
      description: "Task description here",
      status: "TODO",
      priority: "HIGH",
      dueDate: "2026-12-31",
      assigneeEmail: "user@example.com",
      projectName: "My Project",
    },
    {
      title: "Example Task 2",
      description: "",
      status: "IN_PROGRESS",
      priority: "MEDIUM",
      dueDate: "",
      assigneeEmail: "",
      projectName: "",
    },
  ];

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(sampleRows);
  ws["!cols"] = [
    { wch: 30 }, { wch: 40 }, { wch: 15 }, { wch: 12 },
    { wch: 14 }, { wch: 28 }, { wch: 25 },
  ];
  XLSX.utils.book_append_sheet(wb, ws, "Tasks");
  return XLSX.write(wb, { type: "base64", bookType: "xlsx" });
}

export async function getUserImportTemplate() {
  const sampleRows = [
    { name: "John Doe", email: "john@example.com", password: "securepass123", role: "MEMBER" },
    { name: "Jane Smith", email: "jane@example.com", password: "securepass456", role: "VIEWER" },
  ];

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(sampleRows);
  ws["!cols"] = [{ wch: 25 }, { wch: 30 }, { wch: 20 }, { wch: 12 }];
  XLSX.utils.book_append_sheet(wb, ws, "Users");
  return XLSX.write(wb, { type: "base64", bookType: "xlsx" });
}
