"use client";

import { useState } from "react";
import type { ElementType } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Pencil, Plus,
  CheckCircle2, Circle,
  Clock, AlertCircle, Calendar, Target, Activity
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { StatusBadge, PriorityBadge } from "@/components/tasks/task-badge";
import { TaskForm } from "@/components/tasks/task-form";
import { KanbanBoard } from "@/components/projects/kanban-board";
import { deleteTask } from "@/actions/tasks";
import { toast } from "sonner";
import { cn, formatDate, formatRelativeDate, getInitials, calculateProgress, STATUS_COLORS } from "@/lib/utils";

type ProjectDetail = NonNullable<Awaited<ReturnType<typeof import("@/actions/projects").getProject>>>;

export function ProjectDetailClient({ project }: { project: ProjectDetail }) {
  const router = useRouter();
  const [addTaskOpen, setAddTaskOpen] = useState(false);

  const tasks = project.tasks;
  const done = tasks.filter((t) => t.status === "DONE").length;
  const progress = calculateProgress(done, tasks.length);

  const members = project.members.map((m) => m.user);

  const statusCounts = tasks.reduce<Record<string, number>>((acc, t) => {
    acc[t.status] = (acc[t.status] ?? 0) + 1;
    return acc;
  }, {});


  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b border-border bg-card/50 px-6 py-4">
        <div className="flex items-start gap-4 mb-3">
          <Button variant="ghost" size="icon" className="h-8 w-8 mt-0.5" asChild>
            <Link href="/projects"><ArrowLeft className="h-4 w-4" /></Link>
          </Button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2.5 mb-1">
              <span className="h-3 w-3 rounded-full shrink-0" style={{ background: project.color }} />
              <h1 className="text-lg font-semibold truncate">{project.name}</h1>
              <StatusBadge status={project.status} />
              <PriorityBadge priority={project.priority} />
            </div>
            {project.description && (
              <p className="text-sm text-muted-foreground line-clamp-1 ml-5.5">{project.description}</p>
            )}
          </div>
          <Button variant="outline" size="sm" className="h-8 shrink-0" asChild>
            <Link href={`/projects/${project.id}/edit`}>
              <Pencil className="h-3.5 w-3.5" />
              Edit
            </Link>
          </Button>
        </div>

        {/* Progress bar */}
        <div className="ml-[36px]">
          <div className="flex items-center gap-3 mb-1.5">
            <div className="flex -space-x-1.5">
              {members.slice(0, 5).map((m) => (
                <Avatar key={m.id} className="h-6 w-6 border-2 border-card">
                  <AvatarImage src={m.image ?? ""} />
                  <AvatarFallback className="text-[9px]">{getInitials(m.name)}</AvatarFallback>
                </Avatar>
              ))}
              {members.length > 5 && (
                <div className="h-6 w-6 rounded-full bg-muted border-2 border-card flex items-center justify-center text-[9px] text-muted-foreground">
                  +{members.length - 5}
                </div>
              )}
            </div>
            <span className="text-xs text-muted-foreground">{members.length} member{members.length !== 1 ? "s" : ""}</span>
            {project.dueDate && (
              <>
                <span className="text-muted-foreground">·</span>
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Due {formatDate(project.dueDate)}
                </span>
              </>
            )}
            <span className="ml-auto text-xs font-medium">{progress}%</span>
          </div>
          <Progress value={progress} className="h-1.5" />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex-1 overflow-hidden">
        <Tabs defaultValue="overview" className="h-full flex flex-col">
          <div className="border-b border-border px-6">
            <TabsList className="h-10 bg-transparent p-0 gap-1">
              {["overview", "tasks", "board", "timeline", "activity"].map((tab) => (
                <TabsTrigger
                  key={tab}
                  value={tab}
                  className="h-9 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent capitalize px-3 text-sm"
                >
                  {tab}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          <div className="flex-1 overflow-auto">
            {/* Overview Tab */}
            <TabsContent value="overview" className="p-6 space-y-6 mt-0">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard icon={CheckCircle2} label="Completed" value={done} color="text-emerald-500" bg="bg-emerald-50 dark:bg-emerald-900/20" />
                <StatCard icon={Circle} label="In Progress" value={statusCounts["IN_PROGRESS"] ?? 0} color="text-amber-500" bg="bg-amber-50 dark:bg-amber-900/20" />
                <StatCard icon={Clock} label="Todo" value={statusCounts["TODO"] ?? 0} color="text-blue-500" bg="bg-blue-50 dark:bg-blue-900/20" />
                <StatCard icon={AlertCircle} label="Backlog" value={statusCounts["BACKLOG"] ?? 0} color="text-slate-500" bg="bg-slate-100 dark:bg-slate-800" />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Milestones */}
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm">Milestones</CardTitle>
                      <Target className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {project.milestones.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No milestones yet</p>
                    ) : (
                      project.milestones.map((ms) => (
                        <div key={ms.id} className="flex items-center gap-3">
                          <div className={cn(
                            "h-2 w-2 rounded-full shrink-0",
                            ms.status === "COMPLETED" ? "bg-emerald-500" :
                            ms.status === "IN_PROGRESS" ? "bg-amber-500" : "bg-slate-300"
                          )} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{ms.title}</p>
                            {ms.dueDate && <p className="text-xs text-muted-foreground">{formatDate(ms.dueDate)}</p>}
                          </div>
                          <StatusBadge status={ms.status} />
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>

                {/* Recent Activity */}
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm">Recent Activity</CardTitle>
                      <Activity className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {project.activities.slice(0, 5).map((act) => (
                        <div key={act.id} className="flex gap-2.5">
                          <Avatar className="h-6 w-6 shrink-0">
                            <AvatarImage src={act.user.image ?? ""} />
                            <AvatarFallback className="text-[8px]">{getInitials(act.user.name)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-xs">{act.description}</p>
                            <p className="text-[11px] text-muted-foreground">{formatRelativeDate(act.createdAt)}</p>
                          </div>
                        </div>
                      ))}
                      {project.activities.length === 0 && (
                        <p className="text-sm text-muted-foreground">No activity yet</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Risks & Issues */}
              {(project.risks.length > 0 || project.issues.length > 0) && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {project.risks.length > 0 && (
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm">Risks</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        {project.risks.map((r) => (
                          <div key={r.id} className="flex items-center justify-between">
                            <p className="text-sm truncate">{r.title}</p>
                            <PriorityBadge priority={r.severity as string} />
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  )}
                  {project.issues.length > 0 && (
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm">Issues</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        {project.issues.map((i) => (
                          <div key={i.id} className="flex items-center justify-between">
                            <p className="text-sm truncate">{i.title}</p>
                            <PriorityBadge priority={i.severity as string} />
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
            </TabsContent>

            {/* Tasks Tab */}
            <TabsContent value="tasks" className="p-6 mt-0">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-medium text-muted-foreground">{tasks.length} tasks</h2>
                <Dialog open={addTaskOpen} onOpenChange={setAddTaskOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="h-8">
                      <Plus className="h-3.5 w-3.5" />
                      Add Task
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>New Task</DialogTitle>
                    </DialogHeader>
                    <TaskForm
                      projectId={project.id}
                      members={members}
                      onSuccess={() => { setAddTaskOpen(false); router.refresh(); }}
                      onCancel={() => setAddTaskOpen(false)}
                    />
                  </DialogContent>
                </Dialog>
              </div>
              <TaskList tasks={tasks} members={members} projectId={project.id} onRefresh={() => router.refresh()} />
            </TabsContent>

            {/* Board Tab */}
            <TabsContent value="board" className="mt-0 h-full">
              <div className="p-6">
                <KanbanBoard
                  tasks={tasks}
                  members={members}
                  projectId={project.id}
                  onRefresh={() => router.refresh()}
                />
              </div>
            </TabsContent>

            {/* Timeline Tab */}
            <TabsContent value="timeline" className="p-6 mt-0">
              <TimelineView milestones={project.milestones} tasks={tasks.filter((t) => t.dueDate)} />
            </TabsContent>

            {/* Activity Tab */}
            <TabsContent value="activity" className="p-6 mt-0">
              <div className="max-w-2xl space-y-4">
                {project.activities.map((act) => (
                  <div key={act.id} className="flex gap-3">
                    <Avatar className="h-7 w-7 shrink-0">
                      <AvatarImage src={act.user.image ?? ""} />
                      <AvatarFallback className="text-xs">{getInitials(act.user.name)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="text-sm">{act.description}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{formatRelativeDate(act.createdAt)}</p>
                    </div>
                  </div>
                ))}
                {project.activities.length === 0 && (
                  <p className="text-sm text-muted-foreground">No activity yet</p>
                )}
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color, bg }: { icon: ElementType; label: string; value: number; color: string; bg: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className={cn("p-2 rounded-lg", bg)}>
            <Icon className={cn("h-4 w-4", color)} />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="text-xl font-bold">{value}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function TaskList({ tasks, members, projectId, onRefresh }: {
  tasks: ProjectDetail["tasks"];
  members: { id: string; name: string | null; image: string | null }[];
  projectId: string;
  onRefresh: () => void;
}) {
  const [editTask, setEditTask] = useState<ProjectDetail["tasks"][0] | null>(null);

  const handleDelete = async (id: string) => {
    try {
      await deleteTask(id);
      toast.success("Task deleted");
      onRefresh();
    } catch {
      toast.error("Failed to delete task");
    }
  };

  return (
    <>
      <div className="space-y-1">
        {tasks.length === 0 ? (
          <div className="text-center py-12 text-sm text-muted-foreground">No tasks yet. Add one above.</div>
        ) : (
          tasks.map((task) => (
            <div key={task.id} className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-accent/50 group transition-colors">
              <div className={cn("h-2 w-2 rounded-full shrink-0", STATUS_COLORS[task.status as keyof typeof STATUS_COLORS]?.dot ?? "bg-slate-300")} />
              <span className={cn("flex-1 text-sm truncate", task.status === "DONE" && "line-through text-muted-foreground")}>
                {task.title}
              </span>
              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <StatusBadge status={task.status} />
                <PriorityBadge priority={task.priority} />
                {task.assignee && (
                  <Avatar className="h-5 w-5">
                    <AvatarImage src={task.assignee.image ?? ""} />
                    <AvatarFallback className="text-[8px]">{getInitials(task.assignee.name)}</AvatarFallback>
                  </Avatar>
                )}
                {task.dueDate && <span className="text-xs text-muted-foreground">{formatDate(task.dueDate)}</span>}
                <button
                    onClick={() => setEditTask(task)}
                    className="h-6 w-6 rounded flex items-center justify-center hover:bg-muted transition-colors"
                  >
                    <Pencil className="h-3 w-3 text-muted-foreground" />
                  </button>                <button
                  onClick={() => handleDelete(task.id)}
                  className="h-6 w-6 rounded flex items-center justify-center hover:bg-destructive/10 transition-colors"
                >
                  <AlertCircle className="h-3 w-3 text-destructive" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <Dialog open={!!editTask} onOpenChange={(o) => !o && setEditTask(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Task</DialogTitle>
          </DialogHeader>
          {editTask && (
            <TaskForm
              projectId={projectId}
              task={editTask}
              members={members}
              onSuccess={() => { setEditTask(null); onRefresh(); }}
              onCancel={() => setEditTask(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

function TimelineView({ milestones, tasks }: {
  milestones: ProjectDetail["milestones"];
  tasks: ProjectDetail["tasks"];
}) {
  const items = [
    ...milestones.map((m) => ({ id: m.id, title: m.title, date: m.dueDate, type: "milestone", status: m.status })),
    ...tasks.map((t) => ({ id: t.id, title: t.title, date: t.dueDate, type: "task", status: t.status })),
  ].filter((i): i is typeof i & { date: Date } => i.date !== null)
   .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  if (items.length === 0) {
    return <div className="text-sm text-muted-foreground text-center py-12">No items with due dates</div>;
  }

  return (
    <div className="max-w-2xl">
      <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-0 before:bottom-0 before:w-px before:bg-border">
        {items.map((item) => (
          <div key={item.id} className="relative">
            <div className={cn(
              "absolute -left-4 top-1.5 h-3 w-3 rounded-full border-2 border-card",
              item.type === "milestone" ? "bg-primary" :
              item.status === "DONE" ? "bg-emerald-500" : "bg-muted-foreground"
            )} />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{item.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {item.type === "milestone" ? "Milestone" : "Task"} · {formatDate(item.date)}
                </p>
              </div>
              <StatusBadge status={item.status} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
