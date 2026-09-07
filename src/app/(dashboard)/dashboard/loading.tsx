import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <div className="flex flex-col h-full">
      {/* Header skeleton */}
      <div className="h-14 border-b border-border px-6 flex items-center gap-3">
        <div className="space-y-1.5">
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-3 w-64" />
        </div>
      </div>
      <div className="p-6 space-y-6">
        {/* KPI row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-7 w-12" />
                </div>
                <Skeleton className="h-8 w-8 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
        {/* Progress */}
        <div className="rounded-xl border border-border bg-card p-5">
          <Skeleton className="h-4 w-32 mb-3" />
          <Skeleton className="h-2 w-full" />
        </div>
        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 rounded-xl border border-border bg-card p-5 space-y-3">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-[180px] w-full rounded-lg" />
          </div>
          <div className="rounded-xl border border-border bg-card p-5 space-y-3">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-32 w-32 rounded-full mx-auto" />
            <div className="space-y-2">
              {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-3 w-full" />)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
