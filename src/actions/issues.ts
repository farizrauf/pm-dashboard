"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const issueSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().optional().nullable(),
  severity: z.enum(["CRITICAL", "HIGH", "MEDIUM", "LOW"]).default("MEDIUM"),
  status: z.enum(["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"]).default("OPEN"),
  projectId: z.string().min(1),
});

export type IssueFormData = z.infer<typeof issueSchema>;

export async function getAllIssues() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  const userId = session.user.id;
  return prisma.issue.findMany({
    where: {
      project: {
        OR: [{ creatorId: userId }, { members: { some: { userId } } }],
      },
    },
    include: { project: { select: { id: true, name: true, color: true } } },
    orderBy: { createdAt: "desc" },
  });
}

export async function createIssue(data: IssueFormData) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  const parsed = issueSchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.errors[0].message };
  const issue = await prisma.issue.create({ data: parsed.data });
  revalidatePath("/issues");
  revalidatePath(`/projects/${parsed.data.projectId}`);
  return { success: true, issue };
}

export async function updateIssue(id: string, data: Partial<IssueFormData>) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  const issue = await prisma.issue.update({ where: { id }, data });
  revalidatePath("/issues");
  revalidatePath(`/projects/${issue.projectId}`);
  return { success: true, issue };
}

export async function deleteIssue(id: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  const issue = await prisma.issue.delete({ where: { id } });
  revalidatePath("/issues");
  revalidatePath(`/projects/${issue.projectId}`);
  return { success: true };
}
