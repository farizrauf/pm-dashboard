import { Skeleton } from "@/components/ui/skeleton";

export default function TasksLoading() {
  return (
    <div className="flex flex-col h-full">
      <div className="h-14 border-b border-border px-6 flex items-center">
        <Skeleton className="h-4 w-32" />
      </div>
      <div className="p-6 space-y-4">
        <div className="flex gap-3">
          <Skeleton className="h-8 w-48 rounded-md" />
          <Skeleton className="h-8 w-32 rounded-md" />
          <Skeleton className="h-8 w-32 rounded-md" />
        </div>
        <div className="rounded-xl border border-border overflow-hidden">
          <div className="bg-muted/30 px-4 py-2.5 flex gap-4">
            {["Title", "Status", "Priority", "Assignee", "Due"].map((h) => (
              <Skeleton key={h} className="h-3 w-20" />
            ))}
          </div>
          {[...Array(8)].map((_, i) => (
            <div key={i} className="px-4 py-3 border-b border-border last:border-0 flex gap-4 items-center">
              <Skeleton className="h-4 flex-1" />
              <Skeleton className="h-5 w-20 rounded-full" />
              <Skeleton className="h-5 w-16 rounded-full" />
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-4 w-20" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
