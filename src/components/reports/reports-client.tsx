"use client";

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { PriorityBadge } from "@/components/tasks/task-badge";
import { cn, formatDate, getInitials, calculateProgress, STATUS_LABELS, PRIORITY_LABELS } from "@/lib/utils";

const STATUS_COLORS_MAP: Record<string, string> = {
  BACKLOG: "#9A9AA8",
  TODO: "#60A5FA",
  IN_PROGRESS: "#F59E0B",
  REVIEW: "#B4ABF4",
  DONE: "#10B981",
};

const PRIORITY_COLORS_MAP: Record<string, string> = {
  CRITICAL: "#EF4444",
  HIGH: "#F97316",
  MEDIUM: "#F59E0B",
  LOW: "#9A9AA8",
};

interface TaskStatusGroup { status: string; _count: { id: number } }
interface TaskPriorityGroup { priority: string; _count: { id: number } }
interface ProjectWithTasks { id: string; name: string; tasks: { id: string; status: string }[] }
interface TeamMemberWithTasks { id: string; name: string | null; assignedTasks: { id: string; priority: string }[] }
interface OverdueTask { id: string; title: string; priority: string; dueDate: Date | null; project?: { id: string; name: string; color: string } | null; assignee?: { id: string; name: string | null; image: string | null } | null }

interface ReportsClientProps {
  projects: ProjectWithTasks[];
  tasksByStatus: TaskStatusGroup[];
  tasksByPriority: TaskPriorityGroup[];
  overdueTasks: OverdueTask[];
  completionByProject: ProjectWithTasks[];
  teamWorkload: TeamMemberWithTasks[];
  dailyActivity: { date: string; created: number; completed: number }[];
}

export function ReportsClient({
  projects, tasksByStatus, tasksByPriority, overdueTasks,
  completionByProject, teamWorkload, dailyActivity,
}: ReportsClientProps) {

  const totalTasks = tasksByStatus.reduce((s, t) => s + t._count.id, 0);
  const completedTasks = tasksByStatus.find((t) => t.status === "DONE")?._count.id ?? 0;
  const inProgressTasks = tasksByStatus.find((t) => t.status === "IN_PROGRESS")?._count.id ?? 0;
  const overallProgress = calculateProgress(completedTasks, totalTasks);

  const statusChartData = tasksByStatus.map((t) => ({
    name: STATUS_LABELS[t.status] ?? t.status,
    value: t._count.id,
    color: STATUS_COLORS_MAP[t.status] ?? "#9A9AA8",
  }));

  const priorityChartData = tasksByPriority.map((t) => ({
    name: PRIORITY_LABELS[t.priority] ?? t.priority,
    value: t._count.id,
    color: PRIORITY_COLORS_MAP[t.priority] ?? "#9A9AA8",
  }));

  const projectProgressData = completionByProject.map((p) => {
    const done = p.tasks.filter((t: { status: string }) => t.status === "DONE").length;
    return {
      name: p.name.length > 16 ? p.name.slice(0, 16) + "…" : p.name,
      completed: done,
      total: p.tasks.length,
      progress: calculateProgress(done, p.tasks.length),
    };
  });

  const workloadData = teamWorkload.slice(0, 8).map((m) => ({
    name: m.name?.split(" ")[0] ?? "User",
    tasks: m.assignedTasks.length,
  }));

  const tooltipStyle = {
    background: "hsl(var(--card))",
    border: "1px solid hsl(var(--border))",
    borderRadius: "8px",
    fontSize: "12px",
    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
  };

  return (
    <div className="space-y-6">
      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard label="Total Projects" value={projects.length} />
        <SummaryCard label="Total Tasks" value={totalTasks} />
        <SummaryCard label="Completed" value={completedTasks} />
        <SummaryCard label="Overdue" value={overdueTasks.length} warning={overdueTasks.length > 0} />
      </div>

      {/* Progress */}
      <Card>
        <CardContent className="pt-5 pb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Overall Completion Rate</span>
            <span className="text-sm font-bold text-primary">{overallProgress}%</span>
          </div>
          <Progress value={overallProgress} className="h-2" />
          <p className="text-xs text-muted-foreground mt-2">
            {completedTasks} completed · {inProgressTasks} in progress · {overdueTasks.length} overdue
          </p>
        </CardContent>
      </Card>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Daily activity */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle>Task Activity (Last 30 Days)</CardTitle>
            <CardDescription>Created vs completed tasks</CardDescription>
          </CardHeader>
          <CardContent>
            {dailyActivity.length === 0 ? (
              <ChartEmpty label="No activity data" />
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={dailyActivity} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="createdGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#60A5FA" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#60A5FA" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="completedGrad2" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Area type="monotone" dataKey="created" stroke="#60A5FA" strokeWidth={2} fill="url(#createdGrad)" name="Created" />
                  <Area type="monotone" dataKey="completed" stroke="#10B981" strokeWidth={2} fill="url(#completedGrad2)" name="Completed" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Status pie */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>By Status</CardTitle>
          </CardHeader>
          <CardContent>
            {statusChartData.length === 0 ? (
              <ChartEmpty label="No status data" />
            ) : (
              <>
                <div className="flex justify-center mb-3">
                  <PieChart width={140} height={140}>
                    <Pie data={statusChartData} cx={65} cy={65} innerRadius={40} outerRadius={62} paddingAngle={2} dataKey="value">
                      {statusChartData.map((e, i) => <Cell key={i} fill={e.color} />)}
                    </Pie>
                  </PieChart>
                </div>
                <div className="space-y-1.5">
                  {statusChartData.map((e) => (
                <div key={e.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full" style={{ background: e.color }} />
                    <span className="text-muted-foreground">{e.name}</span>
                  </div>
                  <span className="font-medium">{e.value}</span>
                </div>
              ))}
                </div>
                </>
              )}
          </CardContent>
        </Card>
      </div>

      {/* Charts row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Project completion */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Project Progress</CardTitle>
            <CardDescription>Completion rate per project</CardDescription>
          </CardHeader>
          <CardContent>
            {projectProgressData.length === 0 ? (
              <ChartEmpty label="No project data" />
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={projectProgressData} margin={{ top: 5, right: 5, left: -20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} angle={-25} textAnchor="end" />
                  <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} domain={[0, 100]} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`${v}%`, "Progress"]} />
                  <Bar dataKey="progress" fill="#B4ABF4" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Team workload */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Team Workload</CardTitle>
            <CardDescription>Active tasks per member</CardDescription>
          </CardHeader>
          <CardContent>
            {workloadData.length === 0 ? (
              <ChartEmpty label="No workload data" />
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={workloadData} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} width={50} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="tasks" fill="#BFD2D1" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Priority breakdown */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Tasks by Priority</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {priorityChartData.map((p) => (
              <div key={p.name} className="flex flex-col items-center gap-2 p-4 rounded-xl border border-border">
                <div className="h-12 w-12 rounded-full flex items-center justify-center" style={{ background: p.color + "20" }}>
                  <span className="text-lg font-bold" style={{ color: p.color }}>{p.value}</span>
                </div>
                <span className="text-xs text-muted-foreground">{p.name}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Overdue tasks */}
      {overdueTasks.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-destructive">Overdue Tasks</CardTitle>
            <CardDescription>{overdueTasks.length} task{overdueTasks.length !== 1 ? "s" : ""} past their due date</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {overdueTasks.slice(0, 10).map((task) => (
                <div key={task.id} className="flex items-center gap-3 py-2 border-b border-border last:border-0">
                  {task.project && (
                    <span className="h-2 w-2 rounded-full shrink-0" style={{ background: task.project.color }} />
                  )}
                  <span className="flex-1 text-sm truncate">{task.title}</span>
                  <PriorityBadge priority={task.priority} />
                  <span className="text-xs text-destructive shrink-0">{formatDate(task.dueDate)}</span>
                  {task.assignee && (
                    <Avatar className="h-5 w-5 shrink-0">
                      <AvatarImage src={task.assignee.image ?? ""} />
                      <AvatarFallback className="text-[8px]">{getInitials(task.assignee.name)}</AvatarFallback>
                    </Avatar>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function ChartEmpty({ height = 200, label = "No data available" }: { height?: number; label?: string }) {
  return (
    <div
      className="flex items-center justify-center text-sm text-muted-foreground"
      style={{ height }}
    >
      {label}
    </div>
  );
}

function SummaryCard({ label, value, warning }: { label: string; value: number; warning?: boolean }) {
  return (
    <Card className={cn(warning && value > 0 && "border-red-200 dark:border-red-800/50")}>
      <CardContent className="p-5">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-2xl font-bold mt-1">{value}</p>
      </CardContent>
    </Card>
  );
}
