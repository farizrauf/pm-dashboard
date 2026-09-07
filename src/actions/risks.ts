"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const riskSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().optional().nullable(),
  severity: z.enum(["CRITICAL", "HIGH", "MEDIUM", "LOW"]).default("MEDIUM"),
  probability: z.enum(["CRITICAL", "HIGH", "MEDIUM", "LOW"]).default("MEDIUM"),
  status: z.enum(["OPEN", "MITIGATED", "CLOSED"]).default("OPEN"),
  projectId: z.string().min(1),
});

export type RiskFormData = z.infer<typeof riskSchema>;

export async function getAllRisks() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  const userId = session.user.id;
  return prisma.risk.findMany({
    where: {
      project: {
        OR: [{ creatorId: userId }, { members: { some: { userId } } }],
      },
    },
    include: { project: { select: { id: true, name: true, color: true } } },
    orderBy: { createdAt: "desc" },
  });
}

export async function createRisk(data: RiskFormData) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  const parsed = riskSchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.errors[0].message };
  const risk = await prisma.risk.create({ data: parsed.data });
  revalidatePath("/risks");
  revalidatePath(`/projects/${parsed.data.projectId}`);
  return { success: true, risk };
}

export async function updateRisk(id: string, data: Partial<RiskFormData>) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  const risk = await prisma.risk.update({ where: { id }, data });
  revalidatePath("/risks");
  revalidatePath(`/projects/${risk.projectId}`);
  return { success: true, risk };
}

export async function deleteRisk(id: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  const risk = await prisma.risk.delete({ where: { id } });
  revalidatePath("/risks");
  revalidatePath(`/projects/${risk.projectId}`);
  return { success: true };
}
