import { auth } from "@/lib/auth";
import { getDashboardStats, getChartData } from "@/actions/dashboard";
import { Header } from "@/components/layout/header";
import { DashboardClientLazy } from "@/components/dashboard/dashboard-client-lazy";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Dashboard" };
// Revalidate every 60s — matches dashboard cache TTL
export const revalidate = 60;

function ChartFallback() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div className="lg:col-span-2 rounded-xl border border-border bg-card p-5 space-y-3">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-[180px] w-full rounded-lg" />
      </div>
      <div className="rounded-xl border border-border bg-card p-5 space-y-3">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-32 w-32 rounded-full mx-auto" />
      </div>
    </div>
  );
}

export default async function DashboardPage() {
  const session = await auth();
  // Fetch stats and chart data in parallel — stats is faster (cached 60s)
  const [stats, chartData] = await Promise.all([
    getDashboardStats(),
    getChartData(),
  ]);

  return (
    <div className="flex flex-col h-full">
      <Header
        title={`Good ${getGreeting()}, ${session?.user?.name?.split(" ")[0] ?? "there"}`}
        description="Here's what's happening with your projects today."
      />
      <div className="flex-1 p-6 space-y-6 overflow-auto">
        <Suspense fallback={<ChartFallback />}>
          <DashboardClientLazy stats={stats} chartData={chartData} />
        </Suspense>
      </div>
    </div>
  );
}

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}
