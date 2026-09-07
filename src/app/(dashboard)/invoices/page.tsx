import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Header } from "@/components/layout/header";
import { InvoicesClient } from "@/components/finance/invoices-client";
import { getAllInvoices } from "@/actions/invoices";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Invoices" };
export const revalidate = 30;

export default async function InvoicesPage() {
  const session = await auth();
  const userId = session!.user!.id!;

  const [invoices, budgets] = await Promise.all([
    getAllInvoices(),
    prisma.budget.findMany({
      where: {
        project: {
          OR: [{ creatorId: userId }, { members: { some: { userId } } }],
        },
      },
      include: { project: { select: { id: true, name: true, color: true } } },
    }),
  ]);

  const totalPaid = invoices.filter((i) => i.status === "PAID").reduce((s, i) => s + i.amount, 0);

  return (
    <div className="flex flex-col h-full">
      <Header
        title="Invoices"
        description={`${invoices.length} invoice${invoices.length !== 1 ? "s" : ""} · $${totalPaid.toLocaleString()} collected`}
      />
      <div className="flex-1 p-6 overflow-auto">
        <InvoicesClient invoices={invoices} budgets={budgets} />
      </div>
    </div>
  );
}
