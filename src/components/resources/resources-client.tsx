"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Plus, Cpu, User, FolderKanban, Clock, Pencil, Trash2,
  MoreHorizontal, Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { upsertAllocation, deleteAllocation, type AllocationFormData } from "@/actions/resources";
import { toast } from "sonner";
import { cn, getInitials } from "@/lib/utils";

type Member = { id: string; name: string | null; email: string; image: string | null; role: string; assignedTasks: { id: string }[] };
type Project = { id: string; name: string; color: string; status: string };
type Allocation = {
  id: string; hoursPerWeek: number; role: string | null; notes: string | null;
  startDate: Date | null; endDate: Date | null;
  user: { id: string; name: string | null; image: string | null; email: string };
  project: { id: string; name: string; color: string };
};

const MAX_HOURS = 40;

const emptyForm = { userId: "", projectId: "", role: "", hoursPerWeek: "20", startDate: "", endDate: "", notes: "" };

export function ResourcesClient({ members, projects, allocations: initial }: { members: Member[]; projects: Project[]; allocations: Allocation[] }) {
  const router = useRouter();
  const [view, setView] = useState<"members" | "projects">("members");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Allocation | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Allocation | null>(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState(emptyForm);

  // Aggregate hours per member
  const memberHours = members.map((m) => {
    const allocs = initial.filter((a) => a.user.id === m.id);
    const totalHours = allocs.reduce((s, a) => s + a.hoursPerWeek, 0);
    return { ...m, allocations: allocs, totalHours, utilPct: Math.min(100, Math.round((totalHours / MAX_HOURS) * 100)) };
  });

  // Aggregate hours per project
  const projectHours = projects.map((p) => {
    const allocs = initial.filter((a) => a.project.id === p.id);
    const totalHours = allocs.reduce((s, a) => s + a.hoursPerWeek, 0);
    return { ...p, allocations: allocs, totalHours };
  });

  const stats = {
    members: members.length,
    projects: projects.length,
    allocations: initial.length,
    totalHours: initial.reduce((s, a) => s + a.hoursPerWeek, 0),
  };

  const openCreate = () => {
    setEditing(null);
    setForm({ ...emptyForm, userId: members[0]?.id ?? "", projectId: projects[0]?.id ?? "" });
    setFormOpen(true);
  };

  const openEdit = (a: Allocation) => {
    setEditing(a);
    setForm({
      userId: a.user.id, projectId: a.project.id,
      role: a.role ?? "", hoursPerWeek: String(a.hoursPerWeek),
      startDate: a.startDate ? new Date(a.startDate).toISOString().split("T")[0] : "",
      endDate: a.endDate ? new Date(a.endDate).toISOString().split("T")[0] : "",
      notes: a.notes ?? "",
    });
    setFormOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.userId || !form.projectId) { toast.error("Member and project are required"); return; }
    setLoading(true);
    try {
      const data: AllocationFormData = {
        userId: form.userId, projectId: form.projectId,
        role: form.role || null,
        hoursPerWeek: parseFloat(form.hoursPerWeek) || 0,
        startDate: form.startDate || null,
        endDate: form.endDate || null,
        notes: form.notes || null,
      };
      const res = await upsertAllocation(data);
      if ("error" in res && res.error) { toast.error(res.error); return; }
      toast.success(editing ? "Allocation updated" : "Allocation created");
      setFormOpen(false);
      router.refresh();
    } catch { toast.error("Something went wrong"); }
    finally { setLoading(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setLoading(true);
    try {
      await deleteAllocation(deleteTarget.id);
      toast.success("Allocation removed");
      setDeleteTarget(null);
      router.refresh();
    } catch { toast.error("Failed to remove"); }
    finally { setLoading(false); }
  };

  const utilColor = (pct: number) =>
    pct >= 100 ? "[&>div]:bg-destructive" :
    pct >= 80  ? "[&>div]:bg-amber-500" :
    "[&>div]:bg-emerald-500";

  return (
    <>
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Team Members", value: stats.members, icon: User },
          { label: "Projects", value: stats.projects, icon: FolderKanban },
          { label: "Allocations", value: stats.allocations, icon: Cpu },
          { label: "Total Hrs/Week", value: stats.totalHours, icon: Clock },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-border bg-card p-4">
            <s.icon className="h-5 w-5 text-muted-foreground mb-2" />
            <p className="text-2xl font-bold">{s.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3 mb-5">
        <div className="flex rounded-lg border border-border overflow-hidden">
          {(["members", "projects"] as const).map((v) => (
            <button key={v} onClick={() => setView(v)}
              className={cn("px-4 h-8 text-xs font-medium transition-colors capitalize",
                view === v ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent"
              )}
            >{v}</button>
          ))}
        </div>
        <Button size="sm" className="h-8 ml-auto gap-1.5" onClick={openCreate}>
          <Plus className="h-3.5 w-3.5" /> Allocate
        </Button>
      </div>

      {/* By Member */}
      {view === "members" && (
        <div className="space-y-3">
          {memberHours.map((m) => (
            <div key={m.id} className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-start gap-3 mb-3">
                <Avatar className="h-9 w-9 shrink-0">
                  <AvatarImage src={m.image ?? ""} />
                  <AvatarFallback className="text-xs">{getInitials(m.name)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold">{m.name}</p>
                  <p className="text-xs text-muted-foreground">{m.email}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className={cn("text-sm font-bold", m.utilPct >= 100 ? "text-destructive" : m.utilPct >= 80 ? "text-amber-600" : "text-emerald-600")}>
                    {m.totalHours}h/wk
                  </p>
                  <p className="text-xs text-muted-foreground">{m.utilPct}% utilized</p>
                </div>
              </div>
              <Progress value={m.utilPct} className={cn("h-1.5 mb-3", utilColor(m.utilPct))} />
              {m.allocations.length > 0 && (
                <div className="space-y-1.5">
                  {m.allocations.map((a) => (
                    <div key={a.id} className="flex items-center gap-2 group">
                      <span className="h-2 w-2 rounded-full shrink-0" style={{ background: a.project.color }} />
                      <span className="text-xs flex-1 truncate">{a.project.name}</span>
                      {a.role && <span className="text-[10px] text-muted-foreground">{a.role}</span>}
                      <span className="text-xs font-medium text-muted-foreground">{a.hoursPerWeek}h/wk</span>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <MoreHorizontal className="h-3 w-3" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEdit(a)} className="gap-2 text-xs"><Pencil className="h-3 w-3" /> Edit</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => setDeleteTarget(a)} className="gap-2 text-xs text-destructive focus:text-destructive"><Trash2 className="h-3 w-3" /> Remove</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  ))}
                </div>
              )}
              {m.allocations.length === 0 && <p className="text-xs text-muted-foreground">No allocations</p>}
            </div>
          ))}
          {memberHours.length === 0 && (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <Cpu className="h-10 w-10 text-muted-foreground mb-3" />
              <p className="text-base font-medium">No team members found</p>
            </div>
          )}
        </div>
      )}

      {/* By Project */}
      {view === "projects" && (
        <div className="space-y-3">
          {projectHours.map((p) => (
            <div key={p.id} className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center gap-3 mb-3">
                <span className="h-3 w-3 rounded-full shrink-0" style={{ background: p.color }} />
                <p className="text-sm font-semibold flex-1">{p.name}</p>
                <span className="text-sm font-bold text-muted-foreground">{p.totalHours}h/wk total</span>
              </div>
              {p.allocations.length > 0 ? (
                <div className="space-y-1.5">
                  {p.allocations.map((a) => (
                    <div key={a.id} className="flex items-center gap-2 group">
                      <Avatar className="h-5 w-5 shrink-0">
                        <AvatarImage src={a.user.image ?? ""} />
                        <AvatarFallback className="text-[8px]">{getInitials(a.user.name)}</AvatarFallback>
                      </Avatar>
                      <span className="text-xs flex-1 truncate">{a.user.name}</span>
                      {a.role && <span className="text-[10px] text-muted-foreground">{a.role}</span>}
                      <span className="text-xs font-medium text-muted-foreground">{a.hoursPerWeek}h/wk</span>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-5 w-5 opacity-0 group-hover:opacity-100">
                            <MoreHorizontal className="h-3 w-3" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEdit(a)} className="gap-2 text-xs"><Pencil className="h-3 w-3" /> Edit</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => setDeleteTarget(a)} className="gap-2 text-xs text-destructive focus:text-destructive"><Trash2 className="h-3 w-3" /> Remove</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">No allocations</p>
              )}
            </div>
          ))}
          {projectHours.length === 0 && (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <FolderKanban className="h-10 w-10 text-muted-foreground mb-3" />
              <p className="text-base font-medium">No projects found</p>
            </div>
          )}
        </div>
      )}

      {/* Form */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editing ? "Edit Allocation" : "Allocate Resource"}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Member *</Label>
                <Select value={form.userId} onValueChange={(v) => setForm((p) => ({ ...p, userId: v }))} disabled={!!editing}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Select member" /></SelectTrigger>
                  <SelectContent>{members.map((m) => <SelectItem key={m.id} value={m.id}>{m.name ?? m.email}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Project *</Label>
                <Select value={form.projectId} onValueChange={(v) => setForm((p) => ({ ...p, projectId: v }))} disabled={!!editing}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Select project" /></SelectTrigger>
                  <SelectContent>{projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Role</Label>
                <Input value={form.role} onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))} placeholder="e.g. Developer" className="h-9 text-sm" />
              </div>
              <div className="space-y-1.5">
                <Label>Hours/Week</Label>
                <Input type="number" min={0} max={168} value={form.hoursPerWeek} onChange={(e) => setForm((p) => ({ ...p, hoursPerWeek: e.target.value }))} className="h-9 text-sm" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Start Date</Label>
                <Input type="date" value={form.startDate} onChange={(e) => setForm((p) => ({ ...p, startDate: e.target.value }))} className="h-9 text-sm" />
              </div>
              <div className="space-y-1.5">
                <Label>End Date</Label>
                <Input type="date" value={form.endDate} onChange={(e) => setForm((p) => ({ ...p, endDate: e.target.value }))} className="h-9 text-sm" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Notes</Label>
              <Textarea value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)} disabled={loading}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={loading}>
              {loading ? <><Loader2 className="h-3.5 w-3.5 animate-spin mr-2" />Saving...</> : editing ? "Save Changes" : "Allocate"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Allocation</AlertDialogTitle>
            <AlertDialogDescription>Remove {deleteTarget?.user.name} from {deleteTarget?.project.name}?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90" disabled={loading}>Remove</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
