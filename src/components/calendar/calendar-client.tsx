"use client";

import { useState } from "react";
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval,
  isSameDay, isSameMonth, addMonths, subMonths, startOfWeek, endOfWeek, isToday,
} from "date-fns";
import { ChevronLeft, ChevronRight, Target, CheckSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn, formatDate } from "@/lib/utils";
import { StatusBadge } from "@/components/tasks/task-badge";

type CalendarTask = {
  id: string;
  title: string;
  status: string;
  priority: string;
  dueDate: Date | null;
  project?: { id: string; name: string; color: string } | null;
};

type CalendarMilestone = {
  id: string;
  title: string;
  status: string;
  dueDate: Date | null;
  project?: { id: string; name: string; color: string } | null;
};

interface CalendarClientProps {
  tasks: CalendarTask[];
  milestones: CalendarMilestone[];
}

export function CalendarClient({ tasks, milestones }: CalendarClientProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: calStart, end: calEnd });

  const getItemsForDay = (day: Date) => {
    const dayTasks = tasks.filter((t) => t.dueDate && isSameDay(new Date(t.dueDate), day));
    const dayMilestones = milestones.filter((m) => m.dueDate && isSameDay(new Date(m.dueDate), day));
    return { tasks: dayTasks, milestones: dayMilestones };
  };

  const selectedItems = selectedDate ? getItemsForDay(selectedDate) : null;

  // Upcoming events (next 30 days)
  const now = new Date();
  const in30 = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const upcoming = [
    ...tasks
      .filter((t) => t.dueDate && new Date(t.dueDate) >= now && new Date(t.dueDate) <= in30)
      .map((t) => ({ ...t, type: "task" as const })),
    ...milestones
      .filter((m) => m.dueDate && new Date(m.dueDate) >= now && new Date(m.dueDate) <= in30)
      .map((m) => ({ ...m, type: "milestone" as const })),
  ].sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime());

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6">
      {/* Calendar grid */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">{format(currentMonth, "MMMM yyyy")}</CardTitle>
            <div className="flex gap-1">
              <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
                <ChevronLeft className="h-3.5 w-3.5" />
              </Button>
              <Button variant="outline" size="sm" className="h-7 text-xs px-2" onClick={() => setCurrentMonth(new Date())}>
                Today
              </Button>
              <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-3 pb-3">
          {/* Day headers */}
          <div className="grid grid-cols-7 mb-2">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
              <div key={d} className="text-center text-xs font-medium text-muted-foreground py-1.5">
                {d}
              </div>
            ))}
          </div>

          {/* Days */}
          <div className="grid grid-cols-7 gap-px">
            {days.map((day) => {
              const { tasks: dayTasks, milestones: dayMs } = getItemsForDay(day);
              const totalItems = dayTasks.length + dayMs.length;
              const isSelected = selectedDate && isSameDay(day, selectedDate);
              const isCurrentMonth = isSameMonth(day, currentMonth);

              return (
                <button
                  key={day.toISOString()}
                  onClick={() => setSelectedDate(isSameDay(day, selectedDate ?? new Date(0)) ? null : day)}
                  className={cn(
                    "relative min-h-[72px] p-1.5 rounded-lg text-left transition-colors",
                    isCurrentMonth ? "bg-card hover:bg-accent/50" : "bg-transparent opacity-40",
                    isSelected && "bg-primary/10 ring-1 ring-primary/30",
                    isToday(day) && !isSelected && "bg-accent/30"
                  )}
                >
                  <span className={cn(
                    "flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium",
                    isToday(day) ? "bg-primary text-primary-foreground" : "text-foreground"
                  )}>
                    {format(day, "d")}
                  </span>

                  {totalItems > 0 && (
                    <div className="mt-1 space-y-0.5">
                      {dayTasks.slice(0, 2).map((t) => (
                        <div
                          key={t.id}
                          className="flex items-center gap-1 rounded px-1 py-0.5"
                          style={{ background: (t.project?.color ?? "#B4ABF4") + "20" }}
                        >
                          <span className="h-1 w-1 rounded-full shrink-0" style={{ background: t.project?.color ?? "#B4ABF4" }} />
                          <span className="text-[10px] truncate">{t.title}</span>
                        </div>
                      ))}
                      {dayMs.slice(0, 1).map((m) => (
                        <div
                          key={m.id}
                          className="flex items-center gap-1 rounded px-1 py-0.5 bg-primary/10"
                        >
                          <Target className="h-2 w-2 text-primary shrink-0" />
                          <span className="text-[10px] truncate">{m.title}</span>
                        </div>
                      ))}
                      {totalItems > 3 && (
                        <span className="text-[10px] text-muted-foreground px-1">+{totalItems - 3} more</span>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Sidebar */}
      <div className="space-y-4">
        {/* Selected day details */}
        {selectedDate && selectedItems && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">{format(selectedDate, "MMMM d, yyyy")}</CardTitle>
            </CardHeader>
            <CardContent>
              {selectedItems.tasks.length === 0 && selectedItems.milestones.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nothing due on this day.</p>
              ) : (
                <div className="space-y-2">
                  {selectedItems.milestones.map((m) => (
                    <div key={m.id} className="flex items-start gap-2 p-2 rounded-lg bg-primary/5 border border-primary/10">
                      <Target className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                      <div>
                        <p className="text-xs font-medium">{m.title}</p>
                        <p className="text-[11px] text-muted-foreground">{m.project?.name} · Milestone</p>
                      </div>
                    </div>
                  ))}
                  {selectedItems.tasks.map((t) => (
                    <div key={t.id} className="flex items-start gap-2 p-2 rounded-lg border border-border">
                      <CheckSquare className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs font-medium truncate">{t.title}</p>
                        <div className="flex items-center gap-1.5 mt-1">
                          {t.project && (
                            <span className="text-[11px] text-muted-foreground">{t.project.name}</span>
                          )}
                          <StatusBadge status={t.status} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Upcoming */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Upcoming (30 days)</CardTitle>
          </CardHeader>
          <CardContent>
            {upcoming.length === 0 ? (
              <p className="text-sm text-muted-foreground">No upcoming deadlines.</p>
            ) : (
              <div className="space-y-2.5">
                {upcoming.slice(0, 8).map((item) => (
                  <div key={item.id} className="flex items-start gap-2">
                    {item.type === "milestone" ? (
                      <Target className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                    ) : (
                      <CheckSquare className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{item.title}</p>
                      <p className="text-[11px] text-muted-foreground">{formatDate(item.dueDate)}</p>
                    </div>
                    {item.project && (
                      <span
                        className="h-2 w-2 rounded-full mt-1 shrink-0"
                        style={{ background: item.project.color }}
                      />
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
