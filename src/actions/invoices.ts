"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const invoiceItemSchema = z.object({
  description: z.string().min(1),
  quantity: z.coerce.number().min(0),
  unitPrice: z.coerce.number().min(0),
  total: z.coerce.number().min(0),
});

const invoiceSchema = z.object({
  title: z.string().min(1).max(200),
  amount: z.coerce.number().min(0),
  status: z.enum(["DRAFT", "SENT", "PAID", "OVERDUE", "CANCELLED"]).default("DRAFT"),
  issuedAt: z.string().optional(),
  dueAt: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  image: z.string().optional().nullable(),
  budgetId: z.string().min(1),
  items: z.array(invoiceItemSchema).optional(),
});

export type InvoiceFormData = z.infer<typeof invoiceSchema>;

async function getNextInvoiceNo(): Promise<string> {
  const count = await prisma.invoice.count();
  return `INV-${String(count + 1).padStart(4, "0")}`;
}

export async function getAllInvoices() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  const userId = session.user.id;

  return prisma.invoice.findMany({
    where: {
      budget: {
        project: {
          OR: [{ creatorId: userId }, { members: { some: { userId } } }],
        },
      },
    },
    include: {
      items: true,
      budget: {
        include: { project: { select: { id: true, name: true, color: true } } },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function createInvoice(data: InvoiceFormData) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  const parsed = invoiceSchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.errors[0].message };

  const { items, issuedAt, dueAt, image, ...rest } = parsed.data;
  const invoiceNo = await getNextInvoiceNo();

  const invoice = await prisma.invoice.create({
    data: {
      ...rest,
      invoiceNo,
      issuedAt: issuedAt ? new Date(issuedAt) : new Date(),
      dueAt: dueAt ? new Date(dueAt) : null,
      image: image || null,
      items: items?.length
        ? { create: items }
        : undefined,
    },
    include: { items: true },
  });

  revalidatePath("/invoices");
  return { success: true, invoice };
}

export async function updateInvoiceStatus(id: string, status: "DRAFT" | "SENT" | "PAID" | "OVERDUE" | "CANCELLED") {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const invoice = await prisma.invoice.update({
    where: { id },
    data: {
      status,
      paidAt: status === "PAID" ? new Date() : null,
    },
  });

  revalidatePath("/invoices");
  return { success: true, invoice };
}

export async function deleteInvoice(id: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  await prisma.invoice.delete({ where: { id } });
  revalidatePath("/invoices");
  return { success: true };
}
