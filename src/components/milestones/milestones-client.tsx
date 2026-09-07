"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import {
  Plus, Flag, CheckCircle2, Clock, AlertTriangle, Circle,
  Pencil, Trash2, MoreHorizontal, Loader2, CalendarDays,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { createMilestone, updateMilestone, deleteMilestone } from "@/actions/milestones";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Milestone = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  dueDate: Date | null;
  completedAt: Date | null;
  projectId: string;
  createdAt: Date;
  project: { id: string; name: string; color: string };
};

type Project = { id: string; name: string; color: string };

const STATUS_CONFIG = {
  PENDING:     { label: "Pending",     icon: Circle,        cls: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400" },
  IN_PROGRESS: { label: "In Progress", icon: Clock,         cls: "bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400" },
  COMPLETED:   { label: "Completed",   icon: CheckCircle2,  cls: "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400" },
  MISSED:      { label: "Missed",      icon: AlertTriangle, cls: "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400" },
};

export function MilestonesClient({
  milestones: initial,
  projects,
}: {
  milestones: Milestone[];
  projects: Project[];
}) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [filterProject, setFilterProject] = useState("ALL");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Milestone | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Milestone | null>(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", status: "PENDING", dueDate: "", projectId: "" });

  const filtered = initial.filter((m) => {
    const matchSearch = !search || m.title.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "ALL" || m.status === filterStatus;
    const matchProject = filterProject === "ALL" || m.projectId === filterProject;
    return matchSearch && matchStatus && matchProject;
  });

  const stats = {
    total: initial.length,
    completed: initial.filter((m) => m.status === "COMPLETED").length,
    inProgress: initial.filter((m) => m.status === "IN_PROGRESS").length,
    missed: initial.filter((m) => m.status === "MISSED").length,
  };
  const completionPct = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;

  const openCreate = () => {
    setEditing(null);
    setForm({ title: "", description: "", status: "PENDING", dueDate: "", projectId: projects[0]?.id ?? "" });
    setFormOpen(true);
  };

  const openEdit = (m: Milestone) => {
    setEditing(m);
    setForm({
      title: m.title,
      description: m.description ?? "",
      status: m.status,
      dueDate: m.dueDate ? format(new Date(m.dueDate), "yyyy-MM-dd") : "",
      projectId: m.projectId,
    });
    setFormOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.title.trim()) { toast.error("Title is required"); return; }
    setLoading(true);
    try {
      if (editing) {
        await updateMilestone(editing.id, { title: form.title, description: form.description || null, status: form.status as "PENDING" | "IN_PROGRESS" | "COMPLETED" | "MISSED", dueDate: form.dueDate || null });
        toast.success("Milestone updated");
      } else {
        if (!form.projectId) { toast.error("Select a project"); setLoading(false); return; }
        await createMilestone(form.projectId, { title: form.title, description: form.description || null, status: form.status as "PENDING" | "IN_PROGRESS" | "COMPLETED" | "MISSED", dueDate: form.dueDate || null });
        toast.success("Milestone created");
      }
      setFormOpen(false);
      router.refresh();
    } catch { toast.error("Something went wrong"); }
    finally { setLoading(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setLoading(true);
    try {
      await deleteMilestone(deleteTarget.id);
      toast.success("Milestone deleted");
      setDeleteTarget(null);
      router.refresh();
    } catch { toast.error("Failed to delete"); }
    finally { setLoading(false); }
  };

  return (
    <>
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total", value: stats.total, color: "text-foreground" },
          { label: "Completed", value: stats.completed, color: "text-emerald-600" },
          { label: "In Progress", value: stats.inProgress, color: "text-amber-600" },
          { label: "Missed", value: stats.missed, color: "text-red-500" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-border bg-card p-4">
            <p className={cn("text-2xl font-bold", s.color)}>{s.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Overall progress bar */}
      <div className="rounded-xl border border-border bg-card p-4 mb-6">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-medium">Overall Completion</p>
          <span className="text-sm font-bold text-primary">{completionPct}%</span>
        </div>
        <Progress value={completionPct} className="h-2" />
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <Input placeholder="Search milestones..." className="h-8 text-sm max-w-xs" value={search} onChange={(e) => setSearch(e.target.value)} />
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="h-8 w-36 text-sm"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Statuses</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
            <SelectItem value="COMPLETED">Completed</SelectItem>
            <SelectItem value="MISSED">Missed</SelectItem>
          </SelectContent>
        </Select>
        {projects.length > 0 && (
          <Select value={filterProject} onValueChange={setFilterProject}>
            <SelectTrigger className="h-8 w-40 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Projects</SelectItem>
              {projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
            </SelectContent>
          </Select>
        )}
        <Button size="sm" className="h-8 ml-auto gap-1.5" onClick={openCreate}>
          <Plus className="h-3.5 w-3.5" /> New Milestone
        </Button>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <Flag className="h-10 w-10 text-muted-foreground mb-3" />
          <p className="text-base font-medium">No milestones found</p>
          <p className="text-sm text-muted-foreground mt-1">Create your first milestone to track key goals.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((m) => {
            const cfg = STATUS_CONFIG[m.status as keyof typeof STATUS_CONFIG];
            const Icon = cfg.icon;
            const overdue = m.dueDate && new Date(m.dueDate) < new Date() && m.status !== "COMPLETED";
            return (
              <div key={m.id} className="flex items-start gap-4 rounded-xl border border-border bg-card p-4 hover:bg-accent/20 transition-colors group">
                <div className={cn("mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg", cfg.cls)}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className={cn("text-sm font-semibold", m.status === "COMPLETED" && "line-through text-muted-foreground")}>{m.title}</p>
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0">{cfg.label}</Badge>
                  </div>
                  {m.description && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{m.description}</p>}
                  <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                    <div className="flex items-center gap-1">
                      <span className="h-2 w-2 rounded-full shrink-0" style={{ background: m.project.color }} />
                      <span className="text-xs text-muted-foreground">{m.project.name}</span>
                    </div>
                    {m.dueDate && (
                      <div className={cn("flex items-center gap-1 text-xs", overdue ? "text-destructive font-medium" : "text-muted-foreground")}>
                        <CalendarDays className="h-3 w-3" />
                        <span>{format(new Date(m.dueDate), "MMM d, yyyy")}</span>
                        {overdue && <span>(Overdue)</span>}
                      </div>
                    )}
                    {m.completedAt && (
                      <span className="text-xs text-emerald-600">Completed {format(new Date(m.completedAt), "MMM d")}</span>
                    )}
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      <MoreHorizontal className="h-3.5 w-3.5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => openEdit(m)} className="gap-2"><Pencil className="h-3.5 w-3.5" /> Edit</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setDeleteTarget(m)} className="gap-2 text-destructive focus:text-destructive"><Trash2 className="h-3.5 w-3.5" /> Delete</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            );
          })}
        </div>
      )}

      {/* Form dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editing ? "Edit Milestone" : "New Milestone"}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Title *</Label>
              <Input value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} placeholder="Milestone title" autoFocus />
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} rows={2} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm((p) => ({ ...p, status: v }))}>
                  <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                    <SelectItem value="COMPLETED">Completed</SelectItem>
                    <SelectItem value="MISSED">Missed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Due Date</Label>
                <Input type="date" value={form.dueDate} onChange={(e) => setForm((p) => ({ ...p, dueDate: e.target.value }))} className="h-8 text-sm" />
              </div>
            </div>
            {!editing && (
              <div className="space-y-1.5">
                <Label>Project *</Label>
                <Select value={form.projectId} onValueChange={(v) => setForm((p) => ({ ...p, projectId: v }))}>
                  <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Select project" /></SelectTrigger>
                  <SelectContent>{projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)} disabled={loading}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={loading}>
              {loading ? <><Loader2 className="h-3.5 w-3.5 animate-spin mr-2" />Saving...</> : editing ? "Save Changes" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Milestone</AlertDialogTitle>
            <AlertDialogDescription>Delete &quot;{deleteTarget?.title}&quot;? This cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90" disabled={loading}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
