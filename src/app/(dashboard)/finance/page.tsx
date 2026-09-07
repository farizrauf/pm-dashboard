import { auth } from "@/lib/auth";
import { Header } from "@/components/layout/header";
import { FinanceClient } from "@/components/finance/finance-client";
import { getFinanceOverview } from "@/actions/finance";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Finance" };
export const revalidate = 30;

export default async function FinancePage() {
  await auth();
  const projects = await getFinanceOverview();

  const totalBudget = projects.reduce((s, p) => s + (p.budget?.totalAmount ?? 0), 0);

  return (
    <div className="flex flex-col h-full">
      <Header
        title="Finance"
        description={`${projects.length} project${projects.length !== 1 ? "s" : ""} · Total budget $${totalBudget.toLocaleString()}`}
      />
      <div className="flex-1 p-6 overflow-auto">
        <FinanceClient projects={projects} />
      </div>
    </div>
  );
}
