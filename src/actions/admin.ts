"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import bcrypt from "bcryptjs";

// ─── Guard helper ─────────────────────────────────────────────────────────────

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });
  if (user?.role !== "ADMIN") throw new Error("Forbidden: Admin only");
  return { userId: session.user.id };
}

// ─── Schemas ─────────────────────────────────────────────────────────────────

const createUserSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  email: z.string().email("Invalid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(["ADMIN", "MEMBER", "VIEWER"]).default("MEMBER"),
});

const updateUserSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  email: z.string().email("Invalid email"),
  role: z.enum(["ADMIN", "MEMBER", "VIEWER"]),
  password: z.string().optional(), // empty = keep current
});

// ─── CRUD ─────────────────────────────────────────────────────────────────────

export async function getUsers(search?: string) {
  await requireAdmin();

  const where = search
    ? {
        OR: [
          { name: { contains: search, mode: "insensitive" as const } },
          { email: { contains: search, mode: "insensitive" as const } },
        ],
      }
    : {};

  const users = await prisma.user.findMany({
    where,
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      role: true,
      createdAt: true,
      _count: {
        select: { assignedTasks: true, projectMembers: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return users;
}

export async function createUser(data: z.infer<typeof createUserSchema>) {
  await requireAdmin();

  const parsed = createUserSchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.errors[0].message };

  const existing = await prisma.user.findUnique({
    where: { email: parsed.data.email },
  });
  if (existing) return { error: "Email already in use" };

  const hashed = await bcrypt.hash(parsed.data.password, 12);

  const user = await prisma.user.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      password: hashed,
      role: parsed.data.role,
    },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  });

  revalidatePath("/settings/users");
  return { success: true, user };
}

export async function updateUser(
  id: string,
  data: z.infer<typeof updateUserSchema>
) {
  const { userId } = await requireAdmin();

  const parsed = updateUserSchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.errors[0].message };

  // Prevent admin from downgrading their own role
  if (id === userId && parsed.data.role !== "ADMIN") {
    return { error: "Cannot change your own admin role" };
  }

  const existing = await prisma.user.findFirst({
    where: { email: parsed.data.email, NOT: { id } },
  });
  if (existing) return { error: "Email already in use" };

  const updateData: Record<string, unknown> = {
    name: parsed.data.name,
    email: parsed.data.email,
    role: parsed.data.role,
  };

  if (parsed.data.password && parsed.data.password.trim().length >= 8) {
    updateData.password = await bcrypt.hash(parsed.data.password, 12);
  }

  const user = await prisma.user.update({
    where: { id },
    data: updateData,
    select: { id: true, name: true, email: true, role: true },
  });

  revalidatePath("/settings/users");
  return { success: true, user };
}

export async function deleteUser(id: string) {
  const { userId } = await requireAdmin();

  if (id === userId) {
    return { error: "Cannot delete your own account" };
  }

  await prisma.user.delete({ where: { id } });

  revalidatePath("/settings/users");
  return { success: true };
}

export async function resetUserPassword(id: string, newPassword: string) {
  await requireAdmin();

  if (newPassword.length < 8) {
    return { error: "Password must be at least 8 characters" };
  }

  const hashed = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({
    where: { id },
    data: { password: hashed },
  });

  return { success: true };
}

// ─── Bulk import ──────────────────────────────────────────────────────────────

export type ImportUserRow = {
  name: string;
  email: string;
  password: string;
  role?: string;
};

export async function importUsers(rows: ImportUserRow[]) {
  await requireAdmin();

  const results: { row: number; status: "ok" | "error"; message?: string }[] = [];
  let successCount = 0;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    try {
      if (!row.email || !row.name || !row.password) {
        results.push({ row: i + 1, status: "error", message: "Missing required fields: name, email, password" });
        continue;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(row.email)) {
        results.push({ row: i + 1, status: "error", message: `Invalid email: ${row.email}` });
        continue;
      }

      if (row.password.length < 8) {
        results.push({ row: i + 1, status: "error", message: "Password must be at least 8 characters" });
        continue;
      }

      const existing = await prisma.user.findUnique({ where: { email: row.email } });
      if (existing) {
        results.push({ row: i + 1, status: "error", message: `Email already exists: ${row.email}` });
        continue;
      }

      const validRoles = ["ADMIN", "MEMBER", "VIEWER"];
      const role = validRoles.includes((row.role ?? "").toUpperCase())
        ? (row.role!.toUpperCase() as "ADMIN" | "MEMBER" | "VIEWER")
        : "MEMBER";

      const hashed = await bcrypt.hash(row.password, 12);
      await prisma.user.create({
        data: { name: row.name, email: row.email, password: hashed, role },
      });

      results.push({ row: i + 1, status: "ok" });
      successCount++;
    } catch (err) {
      results.push({ row: i + 1, status: "error", message: String(err) });
    }
  }

  revalidatePath("/settings/users");
  return { successCount, errorCount: rows.length - successCount, results };
}
