"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";

// ─── Budget ───────────────────────────────────────────────────────────────────

export async function getFinanceOverview() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  const userId = session.user.id;

  const userProjects = {
    OR: [{ creatorId: userId }, { members: { some: { userId } } }],
  };

  const projects = await prisma.project.findMany({
    where: userProjects,
    include: {
      budget: {
        include: {
          expenses: true,
          invoices: true,
        },
      },
    },
    orderBy: { name: "asc" },
  });

  return projects;
}

const budgetSchema = z.object({
  totalAmount: z.coerce.number().min(0),
  currency: z.string().default("USD"),
  notes: z.string().optional().nullable(),
});

export async function upsertBudget(projectId: string, data: z.infer<typeof budgetSchema>) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  const parsed = budgetSchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.errors[0].message };

  const budget = await prisma.budget.upsert({
    where: { projectId },
    create: { ...parsed.data, projectId },
    update: parsed.data,
  });

  revalidatePath("/finance");
  revalidatePath(`/projects/${projectId}`);
  return { success: true, budget };
}

// ─── Expenses ─────────────────────────────────────────────────────────────────

const expenseSchema = z.object({
  title: z.string().min(1).max(200),
  amount: z.coerce.number().min(0),
  category: z.enum(["LABOR", "SOFTWARE", "HARDWARE", "TRAVEL", "MARKETING", "OPERATIONS", "OTHER"]).default("OTHER"),
  date: z.string().optional(),
  description: z.string().optional().nullable(),
});

export type ExpenseFormData = z.infer<typeof expenseSchema>;

export async function createExpense(budgetId: string, data: ExpenseFormData) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  const parsed = expenseSchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.errors[0].message };

  const { date, ...rest } = parsed.data;
  const expense = await prisma.expense.create({
    data: { ...rest, date: date ? new Date(date) : new Date(), budgetId },
  });

  revalidatePath("/finance");
  return { success: true, expense };
}

export async function deleteExpense(id: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  await prisma.expense.delete({ where: { id } });
  revalidatePath("/finance");
  return { success: true };
}
