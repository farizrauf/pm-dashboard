"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Plus, Shield, ShieldAlert, ShieldCheck, Pencil, Trash2,
  MoreHorizontal, Loader2, AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { createRisk, updateRisk, deleteRisk, type RiskFormData } from "@/actions/risks";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Risk = {
  id: string; title: string; description: string | null;
  severity: string; probability: string; status: string;
  projectId: string; createdAt: Date;
  project: { id: string; name: string; color: string };
};

type Project = { id: string; name: string; color: string };

const LEVEL_COLOR: Record<string, string> = {
  CRITICAL: "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400",
  HIGH:     "bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400",
  MEDIUM:   "bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400",
  LOW:      "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
};

const STATUS_COLOR: Record<string, string> = {
  OPEN:      "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400",
  MITIGATED: "bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400",
  CLOSED:    "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400",
};

const RISK_SCORE: Record<string, number> = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
const riskScore = (r: Risk) => RISK_SCORE[r.severity] * RISK_SCORE[r.probability];

const emptyForm = { title: "", description: "", severity: "MEDIUM", probability: "MEDIUM", status: "OPEN", projectId: "" };

export function RisksClient({ risks: initial, projects }: { risks: Risk[]; projects: Project[] }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [filterProject, setFilterProject] = useState("ALL");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Risk | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Risk | null>(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const filtered = initial
    .filter((r) => {
      if (search && !r.title.toLowerCase().includes(search.toLowerCase())) return false;
      if (filterStatus !== "ALL" && r.status !== filterStatus) return false;
      if (filterProject !== "ALL" && r.projectId !== filterProject) return false;
      return true;
    })
    .sort((a, b) => riskScore(b) - riskScore(a));

  const stats = {
    total: initial.length,
    open: initial.filter((r) => r.status === "OPEN").length,
    critical: initial.filter((r) => r.severity === "CRITICAL").length,
    mitigated: initial.filter((r) => r.status === "MITIGATED").length,
  };

  const openCreate = () => {
    setEditing(null);
    setForm({ ...emptyForm, projectId: projects[0]?.id ?? "" });
    setFormOpen(true);
  };

  const openEdit = (r: Risk) => {
    setEditing(r);
    setForm({ title: r.title, description: r.description ?? "", severity: r.severity, probability: r.probability, status: r.status, projectId: r.projectId });
    setFormOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.title.trim()) { toast.error("Title is required"); return; }
    if (!form.projectId) { toast.error("Select a project"); return; }
    setLoading(true);
    try {
      const data: RiskFormData = {
        title: form.title, description: form.description || null,
        severity: form.severity as RiskFormData["severity"],
        probability: form.probability as RiskFormData["probability"],
        status: form.status as RiskFormData["status"],
        projectId: form.projectId,
      };
      if (editing) {
        await updateRisk(editing.id, data);
        toast.success("Risk updated");
      } else {
        await createRisk(data);
        toast.success("Risk created");
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
      await deleteRisk(deleteTarget.id);
      toast.success("Risk deleted");
      setDeleteTarget(null);
      router.refresh();
    } catch { toast.error("Failed to delete"); }
    finally { setLoading(false); }
  };

  const LevelBadge = ({ val }: { val: string }) => (
    <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium", LEVEL_COLOR[val] ?? LEVEL_COLOR.MEDIUM)}>{val}</span>
  );

  return (
    <>
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total Risks", value: stats.total, icon: Shield },
          { label: "Open", value: stats.open, icon: ShieldAlert },
          { label: "Critical", value: stats.critical, icon: AlertTriangle },
          { label: "Mitigated", value: stats.mitigated, icon: ShieldCheck },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-border bg-card p-4">
            <s.icon className="h-5 w-5 text-muted-foreground mb-2" />
            <p className="text-2xl font-bold">{s.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <Input placeholder="Search risks..." className="h-8 text-sm max-w-xs" value={search} onChange={(e) => setSearch(e.target.value)} />
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="h-8 w-36 text-sm"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Statuses</SelectItem>
            <SelectItem value="OPEN">Open</SelectItem>
            <SelectItem value="MITIGATED">Mitigated</SelectItem>
            <SelectItem value="CLOSED">Closed</SelectItem>
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
          <Plus className="h-3.5 w-3.5" /> Add Risk
        </Button>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <ShieldAlert className="h-10 w-10 text-muted-foreground mb-3" />
          <p className="text-base font-medium">No risks found</p>
          <p className="text-sm text-muted-foreground mt-1">Track potential risks to keep projects on track.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-border overflow-hidden bg-card">
          <div className="grid grid-cols-[minmax(0,1fr)_90px_90px_100px_120px_40px] gap-2 px-4 py-2.5 border-b border-border bg-muted/30 text-xs font-medium text-muted-foreground">
            <span>Risk</span><span>Severity</span><span>Probability</span><span>Score</span><span>Status</span><span />
          </div>
          {filtered.map((r) => {
            const score = riskScore(r);
            const scoreColor = score >= 12 ? "text-red-600 font-bold" : score >= 6 ? "text-amber-600 font-semibold" : "text-muted-foreground";
            return (
              <div key={r.id} className="grid grid-cols-[minmax(0,1fr)_90px_90px_100px_120px_40px] gap-2 px-4 py-3 border-b border-border last:border-0 hover:bg-accent/20 transition-colors group items-center">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{r.title}</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <span className="h-1.5 w-1.5 rounded-full" style={{ background: r.project.color }} />
                    <span className="text-xs text-muted-foreground">{r.project.name}</span>
                  </div>
                </div>
                <LevelBadge val={r.severity} />
                <LevelBadge val={r.probability} />
                <span className={cn("text-sm", scoreColor)}>{score} / 16</span>
                <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium w-fit", STATUS_COLOR[r.status])}>{r.status}</span>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity">
                      <MoreHorizontal className="h-3.5 w-3.5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => openEdit(r)} className="gap-2"><Pencil className="h-3.5 w-3.5" /> Edit</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setDeleteTarget(r)} className="gap-2 text-destructive focus:text-destructive"><Trash2 className="h-3.5 w-3.5" /> Delete</DropdownMenuItem>
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
          <DialogHeader><DialogTitle>{editing ? "Edit Risk" : "Add Risk"}</DialogTitle></DialogHeader>
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
              {(["severity", "probability"] as const).map((field) => (
                <div key={field} className="space-y-1.5">
                  <Label className="capitalize">{field}</Label>
                  <Select value={form[field]} onValueChange={(v) => setForm((p) => ({ ...p, [field]: v }))}>
                    <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {["CRITICAL", "HIGH", "MEDIUM", "LOW"].map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm((p) => ({ ...p, status: v }))}>
                  <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="OPEN">Open</SelectItem>
                    <SelectItem value="MITIGATED">Mitigated</SelectItem>
                    <SelectItem value="CLOSED">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Project *</Label>
                <Select value={form.projectId} onValueChange={(v) => setForm((p) => ({ ...p, projectId: v }))}>
                  <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)} disabled={loading}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={loading}>
              {loading ? <><Loader2 className="h-3.5 w-3.5 animate-spin mr-2" />Saving...</> : editing ? "Save" : "Add Risk"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Risk</AlertDialogTitle>
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
