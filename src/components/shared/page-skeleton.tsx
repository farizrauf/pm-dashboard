import { Skeleton } from "@/components/ui/skeleton";

/** Generic skeleton yang bisa dipakai di semua loading.tsx */

export function HeaderSkeleton({ hasDesc = true }: { hasDesc?: boolean }) {
  return (
    <div className="h-14 border-b border-border px-6 flex items-center gap-3 shrink-0">
      <div className="space-y-1.5">
        <Skeleton className="h-4 w-40" />
        {hasDesc && <Skeleton className="h-3 w-56" />}
      </div>
    </div>
  );
}

export function StatCardsSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className={`grid grid-cols-2 sm:grid-cols-${count} gap-4`}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-xl border border-border bg-card p-4 space-y-2">
          <Skeleton className="h-5 w-5 rounded" />
          <Skeleton className="h-7 w-16" />
          <Skeleton className="h-3 w-24" />
        </div>
      ))}
    </div>
  );
}

export function TableSkeleton({ rows = 6, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="rounded-xl border border-border overflow-hidden bg-card">
      {/* Header */}
      <div className="flex gap-4 px-4 py-2.5 border-b border-border bg-muted/30">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} className="h-3 flex-1" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 px-4 py-3 border-b border-border last:border-0 items-center">
          {Array.from({ length: cols }).map((_, j) => (
            <Skeleton key={j} className={`h-4 flex-1 ${j === 0 ? "max-w-[200px]" : ""}`} />
          ))}
        </div>
      ))}
    </div>
  );
}

export function CardListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-xl border border-border bg-card p-4 flex items-start gap-4">
          <Skeleton className="h-8 w-8 rounded-lg shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
      ))}
    </div>
  );
}

export function ToolbarSkeleton({ filters = 3 }: { filters?: number }) {
  return (
    <div className="flex items-center gap-3 mb-5 flex-wrap">
      <Skeleton className="h-8 w-56 rounded-lg" />
      {Array.from({ length: filters }).map((_, i) => (
        <Skeleton key={i} className="h-8 w-32 rounded-lg" />
      ))}
      <Skeleton className="h-8 w-28 rounded-lg ml-auto" />
    </div>
  );
}

/** Full-page loading skeleton untuk halaman list biasa */
export function ListPageSkeleton({ statCount = 4, tableRows = 6 }: { statCount?: number; tableRows?: number }) {
  return (
    <div className="flex flex-col h-full">
      <HeaderSkeleton />
      <div className="flex-1 p-6 overflow-auto space-y-5">
        <StatCardsSkeleton count={statCount} />
        <ToolbarSkeleton />
        <TableSkeleton rows={tableRows} />
      </div>
    </div>
  );
}

/** Full-page loading skeleton untuk halaman card/list biasa */
export function CardPageSkeleton({ statCount = 4, cardCount = 5 }: { statCount?: number; cardCount?: number }) {
  return (
    <div className="flex flex-col h-full">
      <HeaderSkeleton />
      <div className="flex-1 p-6 overflow-auto space-y-5">
        <StatCardsSkeleton count={statCount} />
        <ToolbarSkeleton filters={2} />
        <CardListSkeleton count={cardCount} />
      </div>
    </div>
  );
}
