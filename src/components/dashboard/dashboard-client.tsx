"use client";

import type { ElementType } from "react";
import { FolderKanban, CheckSquare, TrendingUp, AlertCircle, Clock, Activity } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { cn, formatRelativeDate, formatDate, getInitials, STATUS_LABELS } from "@/lib/utils";

interface DashboardClientProps {
  stats: Awaited<ReturnType<typeof import("@/actions/dashboard").getDashboardStats>>;
  chartData: Awaited<ReturnType<typeof import("@/actions/dashboard").getChartData>>;
}

const STATUS_CHART_COLORS: Record<string, string> = {
  BACKLOG: "#9A9AA8",
  TODO: "#60A5FA",
  IN_PROGRESS: "#F59E0B",
  REVIEW: "#B4ABF4",
  DONE: "#10B981",
};

export function DashboardClient({ stats, chartData }: DashboardClientProps) {
  const { kpis, recentActivity, upcomingDeadlines, teamWorkload, projectsWithProgress, tasksByStatus } = stats;

  const pieData = tasksByStatus.map((t) => ({
    name: STATUS_LABELS[t.status] ?? t.status,
    value: t._count._all,
    color: STATUS_CHART_COLORS[t.status] ?? "#9A9AA8",
    status: t.status,
  }));

  return (
    <div className="space-y-6 animate-fade-in">
      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          label="Active Projects"
          value={kpis.activeProjects}
          icon={FolderKanban}
          color="text-blue-500"
          bg="bg-blue-50 dark:bg-blue-900/20"
          href="/projects"
        />
        <KPICard
          label="Total Tasks"
          value={kpis.totalTasks}
          icon={CheckSquare}
          color="text-lavender-500"
          bg="bg-purple-50 dark:bg-purple-900/20"
          href="/tasks"
        />
        <KPICard
          label="Completed"
          value={kpis.completedTasks}
          icon={TrendingUp}
          color="text-emerald-500"
          bg="bg-emerald-50 dark:bg-emerald-900/20"
          href="/tasks?status=DONE"
        />
        <KPICard
          label="Overdue"
          value={kpis.overdueTasks}
          icon={AlertCircle}
          color="text-red-500"
          bg="bg-red-50 dark:bg-red-900/20"
          href="/tasks?overdue=true"
          warning={kpis.overdueTasks > 0}
        />
      </div>

      {/* Overall Progress */}
      <Card>
        <CardContent className="pt-6 pb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Overall Progress</span>
            <span className="text-sm font-semibold text-primary">{kpis.overallProgress}%</span>
          </div>
          <Progress value={kpis.overallProgress} className="h-2" />
          <p className="text-xs text-muted-foreground mt-2">
            {kpis.completedTasks} of {kpis.totalTasks} tasks completed across all projects
          </p>
        </CardContent>
      </Card>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Completion Trend */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle>Task Completion Trend</CardTitle>
            <CardDescription>Tasks completed per week over the last 8 weeks</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={chartData.completionTrend} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="completedGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#B4ABF4" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#B4ABF4" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="week"
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    fontSize: "12px",
                    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="completed"
                  stroke="#B4ABF4"
                  strokeWidth={2}
                  fill="url(#completedGrad)"
                  dot={{ fill: "#B4ABF4", r: 3, strokeWidth: 0 }}
                  activeDot={{ r: 5, strokeWidth: 0 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Task Status Distribution */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Task Status</CardTitle>
            <CardDescription>Distribution across all projects</CardDescription>
          </CardHeader>
          <CardContent>
            {pieData.length > 0 ? (
              <div className="flex flex-col gap-3">
                <div className="flex justify-center">
                  <PieChart width={120} height={120}>
                    <Pie
                      data={pieData}
                      cx={55}
                      cy={55}
                      innerRadius={35}
                      outerRadius={55}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={index} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </div>
                <div className="space-y-1.5">
                  {pieData.map((entry) => (
                    <div key={entry.status} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full" style={{ background: entry.color }} />
                        <span className="text-muted-foreground">{entry.name}</span>
                      </div>
                      <span className="font-medium">{entry.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">
                No tasks yet
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Projects and Activity Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Project Progress */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Project Progress</CardTitle>
                <CardDescription>Active projects and their completion</CardDescription>
              </div>
              <Button variant="ghost" size="sm" className="h-7 text-xs" asChild>
                <Link href="/projects">View all</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {projectsWithProgress.length === 0 ? (
              <div className="text-sm text-muted-foreground text-center py-6">
                No active projects
              </div>
            ) : (
              projectsWithProgress.map((project) => (
                <Link
                  key={project.id}
                  href={`/projects/${project.id}`}
                  className="block group"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="h-2.5 w-2.5 rounded-full shrink-0"
                        style={{ background: project.color }}
                      />
                      <span className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                        {project.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 shrink-0 ml-2">
                      <div className="flex -space-x-1.5">
                        {project.members.slice(0, 3).map((m) => (
                          <Avatar key={m.userId} className="h-5 w-5 border border-card">
                            <AvatarImage src={m.user.image ?? ""} />
                            <AvatarFallback className="text-[8px]">{getInitials(m.user.name)}</AvatarFallback>
                          </Avatar>
                        ))}
                      </div>
                      <span className="text-xs text-muted-foreground w-8 text-right">
                        {project.progress}%
                      </span>
                    </div>
                  </div>
                  <Progress value={project.progress} className="h-1" />
                  <p className="text-xs text-muted-foreground mt-1">
                    {project.doneCount} / {project.totalCount} tasks
                  </p>
                </Link>
              ))
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle>Recent Activity</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentActivity.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No recent activity</p>
              ) : (
                recentActivity.map((act) => (
                  <div key={act.id} className="flex gap-2.5">
                    <Avatar className="h-6 w-6 shrink-0 mt-0.5">
                      <AvatarImage src={act.user.image ?? ""} />
                      <AvatarFallback className="text-[8px]">{getInitials(act.user.name)}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="text-xs text-foreground leading-snug">{act.description}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {formatRelativeDate(act.createdAt)}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Upcoming Deadlines */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Upcoming Deadlines</CardTitle>
                <CardDescription>Tasks due in the next 14 days</CardDescription>
              </div>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2.5">
              {upcomingDeadlines.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No upcoming deadlines</p>
              ) : (
                upcomingDeadlines.map((task) => (
                  <div key={task.id} className="flex items-center gap-3">
                    <div
                      className="h-1.5 w-1.5 rounded-full shrink-0"
                      style={{ background: task.project?.color ?? "#B4ABF4" }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate">{task.title}</p>
                      <p className="text-xs text-muted-foreground">{task.project?.name}</p>
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {formatDate(task.dueDate)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Team Workload */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Team Workload</CardTitle>
                <CardDescription>Open tasks per team member</CardDescription>
              </div>
              <Button variant="ghost" size="sm" className="h-7 text-xs" asChild>
                <Link href="/team">View team</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {teamWorkload.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No team data</p>
              ) : (
                teamWorkload.slice(0, 5).map((member) => (
                  <div key={member.id} className="flex items-center gap-3">
                    <Avatar className="h-7 w-7 shrink-0">
                      <AvatarImage src={member.image ?? ""} />
                      <AvatarFallback className="text-xs">{getInitials(member.name)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{member.name}</p>
                      <div className="flex items-center gap-1 mt-0.5">
                        <div className="flex-1 bg-muted rounded-full h-1.5 overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full transition-all"
                            style={{ width: `${Math.min((member.taskCount / 10) * 100, 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {member.taskCount} tasks
                    </span>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function KPICard({
  label,
  value,
  icon: Icon,
  color,
  bg,
  href,
  warning,
}: {
  label: string;
  value: number;
  icon: ElementType;
  color: string;
  bg: string;
  href: string;
  warning?: boolean;
}) {
  return (
    <Link href={href}>
      <Card className={cn("transition-all hover:shadow-md cursor-pointer", warning && value > 0 && "border-red-200 dark:border-red-800/50")}>
        <CardContent className="p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">{label}</p>
              <p className="text-2xl font-bold mt-1">{value}</p>
            </div>
            <div className={cn("p-2 rounded-lg", bg)}>
              <Icon className={cn("h-4 w-4", color)} />
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
