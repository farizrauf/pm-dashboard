import { cn, STATUS_COLORS, STATUS_LABELS, PRIORITY_COLORS, PRIORITY_LABELS } from "@/lib/utils";

export function StatusBadge({ status }: { status: string }) {
  const style = STATUS_COLORS[status as keyof typeof STATUS_COLORS];
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium", style?.bg, style?.text)}>
      <span className={cn("h-1.5 w-1.5 rounded-full", style?.dot)} />
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: string }) {
  const style = PRIORITY_COLORS[priority as keyof typeof PRIORITY_COLORS];
  return (
    <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium", style?.bg, style?.text)}>
      {PRIORITY_LABELS[priority] ?? priority}
    </span>
  );
}
