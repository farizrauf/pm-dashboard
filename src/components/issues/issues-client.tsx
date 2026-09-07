"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Plus, AlertCircle, CheckCircle2, Clock, XCircle,
  Pencil, Trash2, MoreHorizontal, Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { createIssue, updateIssue, deleteIssue, type IssueFormData } from "@/actions/issues";
import { toast } from "sonner";
import { cn, formatDate } from "@/lib/utils";

type Issue = {
  id: string; title: string; description: string | null;
  severity: string; status: string; projectId: string; createdAt: Date;
  project: { id: string; name: string; color: string };
};
type Project = { id: string; name: string; color: string };

const SEV_COLOR: Record<string, string> = {
  CRITICAL: "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400",
  HIGH:     "bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400",
  MEDIUM:   "bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400",
  LOW:      "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
};

const STATUS_CONFIG: Record<string, { label: string; icon: React.ElementType; cls: string }> = {
  OPEN:        { label: "Open",        icon: AlertCircle,  cls: "text-red-500" },
  IN_PROGRESS: { label: "In Progress", icon: Clock,        cls: "text-amber-500" },
  RESOLVED:    { label: "Resolved",    icon: CheckCircle2, cls: "text-emerald-500" },
  CLOSED:      { label: "Closed",      icon: XCircle,      cls: "text-slate-400" },
};

const emptyForm = { title: "", description: "", severity: "MEDIUM", status: "OPEN", projectId: "" };

export function IssuesClient({ issues: initial, projects }: { issues: Issue[]; projects: Project[] }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [filterSeverity, setFilterSeverity] = useState("ALL");
  const [filterProject, setFilterProject] = useState("ALL");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Issue | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Issue | null>(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const filtered = initial.filter((i) => {
    if (search && !i.title.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterStatus !== "ALL" && i.status !== filterStatus) return false;
    if (filterSeverity !== "ALL" && i.severity !== filterSeverity) return false;
    if (filterProject !== "ALL" && i.projectId !== filterProject) return false;
    return true;
  });

  const stats = {
    total: initial.length,
    open: initial.filter((i) => i.status === "OPEN").length,
    inProgress: initial.filter((i) => i.status === "IN_PROGRESS").length,
    resolved: initial.filter((i) => ["RESOLVED", "CLOSED"].includes(i.status)).length,
  };

  const openCreate = () => {
    setEditing(null);
    setForm({ ...emptyForm, projectId: projects[0]?.id ?? "" });
    setFormOpen(true);
  };
  const openEdit = (i: Issue) => {
    setEditing(i);
    setForm({ title: i.title, description: i.description ?? "", severity: i.severity, status: i.status, projectId: i.projectId });
    setFormOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.title.trim()) { toast.error("Title is required"); return; }
    if (!form.projectId) { toast.error("Select a project"); return; }
    setLoading(true);
    try {
      const data: IssueFormData = {
        title: form.title, description: form.description || null,
        severity: form.severity as IssueFormData["severity"],
        status: form.status as IssueFormData["status"],
        projectId: form.projectId,
      };
      if (editing) { await updateIssue(editing.id, data); toast.success("Issue updated"); }
      else { await createIssue(data); toast.success("Issue created"); }
      setFormOpen(false);
      router.refresh();
    } catch { toast.error("Something went wrong"); }
    finally { setLoading(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setLoading(true);
    try {
      await deleteIssue(deleteTarget.id);
      toast.success("Issue deleted");
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
          { label: "Total", value: stats.total, color: "" },
          { label: "Open", value: stats.open, color: "text-red-500" },
          { label: "In Progress", value: stats.inProgress, color: "text-amber-500" },
          { label: "Resolved", value: stats.resolved, color: "text-emerald-500" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-border bg-card p-4">
            <p className={cn("text-2xl font-bold", s.color)}>{s.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5 flex-wrap">
        <Input placeholder="Search issues..." className="h-8 text-sm max-w-xs" value={search} onChange={(e) => setSearch(e.target.value)} />
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="h-8 w-36 text-sm"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Statuses</SelectItem>
            <SelectItem value="OPEN">Open</SelectItem>
            <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
            <SelectItem value="RESOLVED">Resolved</SelectItem>
            <SelectItem value="CLOSED">Closed</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterSeverity} onValueChange={setFilterSeverity}>
          <SelectTrigger className="h-8 w-36 text-sm"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Severities</SelectItem>
            <SelectItem value="CRITICAL">Critical</SelectItem>
            <SelectItem value="HIGH">High</SelectItem>
            <SelectItem value="MEDIUM">Medium</SelectItem>
            <SelectItem value="LOW">Low</SelectItem>
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
          <Plus className="h-3.5 w-3.5" /> Report Issue
        </Button>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <AlertCircle className="h-10 w-10 text-muted-foreground mb-3" />
          <p className="text-base font-medium">No issues found</p>
          <p className="text-sm text-muted-foreground mt-1">Report issues to track bugs and blockers.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-border overflow-hidden bg-card">
          <div className="grid grid-cols-[minmax(0,1fr)_100px_110px_120px_40px] gap-2 px-4 py-2.5 border-b border-border bg-muted/30 text-xs font-medium text-muted-foreground">
            <span>Issue</span><span>Severity</span><span>Status</span><span>Created</span><span />
          </div>
          {filtered.map((issue) => {
            const statusCfg = STATUS_CONFIG[issue.status];
            const StatusIcon = statusCfg?.icon ?? AlertCircle;
            return (
              <div key={issue.id} className="grid grid-cols-[minmax(0,1fr)_100px_110px_120px_40px] gap-2 px-4 py-3 border-b border-border last:border-0 hover:bg-accent/20 transition-colors group items-center">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{issue.title}</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <span className="h-1.5 w-1.5 rounded-full" style={{ background: issue.project.color }} />
                    <span className="text-xs text-muted-foreground">{issue.project.name}</span>
                  </div>
                </div>
                <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium w-fit", SEV_COLOR[issue.severity])}>{issue.severity}</span>
                <span className={cn("flex items-center gap-1 text-xs font-medium", statusCfg?.cls)}>
                  <StatusIcon className="h-3.5 w-3.5" />{statusCfg?.label}
                </span>
                <span className="text-xs text-muted-foreground">{formatDate(issue.createdAt)}</span>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity">
                      <MoreHorizontal className="h-3.5 w-3.5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => openEdit(issue)} className="gap-2"><Pencil className="h-3.5 w-3.5" /> Edit</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setDeleteTarget(issue)} className="gap-2 text-destructive focus:text-destructive"><Trash2 className="h-3.5 w-3.5" /> Delete</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            );
          })}
        </div>
      )}

      {/* Form */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editing ? "Edit Issue" : "Report Issue"}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Title *</Label>
              <Input value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} autoFocus />
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} rows={2} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Severity</Label>
                <Select value={form.severity} onValueChange={(v) => setForm((p) => ({ ...p, severity: v }))}>
                  <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["CRITICAL", "HIGH", "MEDIUM", "LOW"].map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm((p) => ({ ...p, status: v }))}>
                  <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="OPEN">Open</SelectItem>
                    <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                    <SelectItem value="RESOLVED">Resolved</SelectItem>
                    <SelectItem value="CLOSED">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Project *</Label>
              <Select value={form.projectId} onValueChange={(v) => setForm((p) => ({ ...p, projectId: v }))}>
                <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Select project" /></SelectTrigger>
                <SelectContent>{projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)} disabled={loading}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={loading}>
              {loading ? <><Loader2 className="h-3.5 w-3.5 animate-spin mr-2" />Saving...</> : editing ? "Save" : "Report"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Issue</AlertDialogTitle>
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
