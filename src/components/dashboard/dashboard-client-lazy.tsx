"use client";

/**
 * Lazy wrapper untuk DashboardClient.
 * Import ini di dashboard/page.tsx agar Recharts tidak masuk ke initial bundle.
 */

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";

export const DashboardClientLazy = dynamic(
  () => import("@/components/dashboard/dashboard-client").then((m) => ({ default: m.DashboardClient })),
  {
    ssr: false,
    loading: () => (
      <div className="space-y-6">
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
      </div>
    ),
  }
);
