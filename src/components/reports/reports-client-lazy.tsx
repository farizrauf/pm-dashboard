"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";

export const ReportsClientLazy = dynamic(
  () => import("@/components/reports/reports-client").then((m) => ({ default: m.ReportsClient })),
  {
    ssr: false,
    loading: () => (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-5 space-y-3">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-[200px] w-full rounded-lg" />
          </div>
        ))}
      </div>
    ),
  }
);
