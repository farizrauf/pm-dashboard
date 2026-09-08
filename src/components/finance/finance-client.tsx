"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  DollarSign, TrendingUp, TrendingDown, PieChart,
  Plus, Pencil, Trash2, Loader2, ChevronDown, ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { upsertBudget, createExpense, deleteExpense } from "@/actions/finance";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

type Expense = { id: string; title: string; amount: number; category: string; date: Date; description: string | null };
type InvoiceSummary = { id: string; amount: number; status: string };
type Budget = { id: string; totalAmount: number; currency: string; notes: string | null; expenses: Expense[]; invoices: InvoiceSummary[] };
type Project = { id: string; name: string; color: string; budget: Budget | null };

const CAT_COLOR: Record<string, string> = {
  LABOR: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  SOFTWARE: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  HARDWARE: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400",
  TRAVEL: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  MARKETING: "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400",
  OPERATIONS: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  OTHER: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
};

function fmt(amount: number, currency = "IDR") {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency, minimumFractionDigits: 0 }).format(amount);
}

export function FinanceClient({ projects }: { projects: Project[] }) {
  const router = useRouter();
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [budgetOpen, setBudgetOpen] = useState(false);
  const [expenseOpen, setExpenseOpen] = useState(false);
  const [deleteExpTarget, setDeleteExpTarget] = useState<{ id: string; title: string } | null>(null);
  const [activeProjectId, setActiveProjectId] = useState<string>("");
  const [activeBudgetId, setActiveBudgetId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [budgetForm, setBudgetForm] = useState({ totalAmount: "", currency: "IDR", notes: "" });
  const [expForm, setExpForm] = useState({ title: "", amount: "", category: "OTHER", date: "", description: "" });

  // Totals
  const totalBudget = projects.reduce((s, p) => s + (p.budget?.totalAmount ?? 0), 0);
  const totalSpent = projects.reduce((s, p) => s + (p.budget?.expenses.reduce((a, e) => a + e.amount, 0) ?? 0), 0);
  const totalInvoiced = projects.reduce((s, p) => s + (p.budget?.invoices.filter(i => i.status !== "CANCELLED").reduce((a, i) => a + i.amount, 0) ?? 0), 0);

  const toggleProject = (id: string) => {
    setExpanded((prev) => {
      const n = new Set(prev);
      if (n.has(id)) { n.delete(id); } else { n.add(id); }
      return n;
    });
  };

  const openBudget = (p: Project) => {
    setActiveProjectId(p.id);
    setBudgetForm({ totalAmount: p.budget?.totalAmount?.toString() ?? "", currency: p.budget?.currency ?? "IDR", notes: p.budget?.notes ?? "" });
    setBudgetOpen(true);
  };

  const openExpense = (p: Project) => {
    setActiveProjectId(p.id);
    setActiveBudgetId(p.budget?.id ?? "");
    setExpForm({ title: "", amount: "", category: "OTHER", date: format(new Date(), "yyyy-MM-dd"), description: "" });
    setExpenseOpen(true);
  };

  const handleSaveBudget = async () => {
    setLoading(true);
    try {
      const res = await upsertBudget(activeProjectId, { totalAmount: parseFloat(budgetForm.totalAmount) || 0, currency: budgetForm.currency, notes: budgetForm.notes || null });
      if ("error" in res && res.error) { toast.error(res.error); return; }
      toast.success("Budget saved");
      setBudgetOpen(false);
      router.refresh();
    } catch { toast.error("Failed to save budget"); }
    finally { setLoading(false); }
  };

  const handleSaveExpense = async () => {
    if (!expForm.title.trim()) { toast.error("Title is required"); return; }
    if (!activeBudgetId) { toast.error("This project has no budget yet. Set a budget first."); return; }
    setLoading(true);
    try {
      const res = await createExpense(activeBudgetId, {
        title: expForm.title, amount: parseFloat(expForm.amount) || 0,
        category: expForm.category as "LABOR" | "SOFTWARE" | "HARDWARE" | "TRAVEL" | "MARKETING" | "OPERATIONS" | "OTHER",
        date: expForm.date || undefined, description: expForm.description || null,
      });
      if ("error" in res && res.error) { toast.error(res.error); return; }
      toast.success("Expense added");
      setExpenseOpen(false);
      router.refresh();
    } catch { toast.error("Failed to add expense"); }
    finally { setLoading(false); }
  };

  const handleDeleteExpense = async () => {
    if (!deleteExpTarget) return;
    setLoading(true);
    try {
      await deleteExpense(deleteExpTarget.id);
      toast.success("Expense deleted");
      setDeleteExpTarget(null);
      router.refresh();
    } catch { toast.error("Failed to delete"); }
    finally { setLoading(false); }
  };

  return (
    <>
      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {[
          { label: "Total Budget", value: fmt(totalBudget), icon: DollarSign, color: "text-primary" },
          { label: "Total Spent", value: fmt(totalSpent), icon: TrendingDown, color: "text-red-500" },
          { label: "Total Invoiced", value: fmt(totalInvoiced), icon: TrendingUp, color: "text-emerald-500" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-border bg-card p-5">
            <s.icon className={cn("h-5 w-5 mb-2", s.color)} />
            <p className={cn("text-2xl font-bold", s.color)}>{s.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Projects */}
      <div className="space-y-3">
        {projects.map((p) => {
          const budget = p.budget;
          const spent = budget?.expenses.reduce((s, e) => s + e.amount, 0) ?? 0;
          const pct = budget?.totalAmount ? Math.min(100, Math.round((spent / budget.totalAmount) * 100)) : 0;
          const isOver = spent > (budget?.totalAmount ?? 0) && (budget?.totalAmount ?? 0) > 0;
          const isOpen = expanded.has(p.id);

          return (
            <div key={p.id} className="rounded-xl border border-border bg-card overflow-hidden">
              {/* Project header row */}
              <div
                className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-accent/20 transition-colors"
                onClick={() => toggleProject(p.id)}
              >
                {isOpen ? <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" /> : <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />}
                <span className="h-3 w-3 rounded-full shrink-0" style={{ background: p.color }} />
                <p className="text-sm font-semibold flex-1">{p.name}</p>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span>Budget: <strong className="text-foreground">{budget ? fmt(budget.totalAmount, budget.currency) : "—"}</strong></span>
                  <span>Spent: <strong className={cn(isOver ? "text-destructive" : "text-foreground")}>{fmt(spent)}</strong></span>
                  {budget && <span className={cn("font-medium", isOver ? "text-destructive" : "text-emerald-600")}>{pct}%</span>}
                </div>
                <div className="flex items-center gap-2 ml-3" onClick={(e) => e.stopPropagation()}>
                  <Button variant="outline" size="sm" className="h-6 text-xs px-2" onClick={() => openBudget(p)}>
                    <Pencil className="h-3 w-3 mr-1" /> Budget
                  </Button>
                  <Button variant="outline" size="sm" className="h-6 text-xs px-2" onClick={() => openExpense(p)}>
                    <Plus className="h-3 w-3 mr-1" /> Expense
                  </Button>
                </div>
              </div>

              {/* Progress bar */}
              {budget && (
                <div className="px-4 pb-2">
                  <Progress value={pct} className={cn("h-1.5", isOver && "[&>div]:bg-destructive")} />
                </div>
              )}

              {/* Expanded: expense list */}
              {isOpen && (
                <div className="border-t border-border">
                  {!budget ? (
                    <p className="text-xs text-muted-foreground text-center py-6">No budget set for this project.</p>
                  ) : budget.expenses.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-6">No expenses recorded.</p>
                  ) : (
                    <div>
                      <div className="grid grid-cols-[minmax(0,1fr)_100px_90px_120px_32px] gap-2 px-4 py-2 bg-muted/20 text-xs font-medium text-muted-foreground border-b border-border">
                        <span>Expense</span><span>Category</span><span className="text-right">Amount</span><span>Date</span><span />
                      </div>
                      {budget.expenses.map((exp) => (
                        <div key={exp.id} className="grid grid-cols-[minmax(0,1fr)_100px_90px_120px_32px] gap-2 px-4 py-2.5 border-b border-border last:border-0 hover:bg-accent/10 items-center group">
                          <div className="min-w-0">
                            <p className="text-sm truncate">{exp.title}</p>
                            {exp.description && <p className="text-xs text-muted-foreground truncate">{exp.description}</p>}
                          </div>
                          <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium w-fit", CAT_COLOR[exp.category])}>{exp.category}</span>
                          <span className="text-sm font-semibold text-right">{fmt(exp.amount)}</span>
                          <span className="text-xs text-muted-foreground">{format(new Date(exp.date), "MMM d, yyyy")}</span>
                          <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => setDeleteExpTarget({ id: exp.id, title: exp.title })}>
                            <Trash2 className="h-3 w-3 text-destructive" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {projects.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <PieChart className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="text-base font-medium">No projects found</p>
            <p className="text-sm text-muted-foreground mt-1">Create projects to start tracking budgets.</p>
          </div>
        )}
      </div>

      {/* Budget dialog */}
      <Dialog open={budgetOpen} onOpenChange={setBudgetOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Set Budget</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Total Amount</Label>
                <Input type="number" min={0} value={budgetForm.totalAmount} onChange={(e) => setBudgetForm((p) => ({ ...p, totalAmount: e.target.value }))} placeholder="0" />
              </div>
              <div className="space-y-1.5">
                <Label>Currency</Label>
                <Select value={budgetForm.currency} onValueChange={(v) => setBudgetForm((p) => ({ ...p, currency: v }))}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["USD", "EUR", "GBP", "IDR", "SGD"].map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Notes</Label>
              <Textarea value={budgetForm.notes} onChange={(e) => setBudgetForm((p) => ({ ...p, notes: e.target.value }))} rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBudgetOpen(false)} disabled={loading}>Cancel</Button>
            <Button onClick={handleSaveBudget} disabled={loading}>
              {loading ? <><Loader2 className="h-3.5 w-3.5 animate-spin mr-2" />Saving...</> : "Save Budget"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Expense dialog */}
      <Dialog open={expenseOpen} onOpenChange={setExpenseOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Add Expense</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Title *</Label>
              <Input value={expForm.title} onChange={(e) => setExpForm((p) => ({ ...p, title: e.target.value }))} autoFocus />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Amount</Label>
                <Input type="number" min={0} value={expForm.amount} onChange={(e) => setExpForm((p) => ({ ...p, amount: e.target.value }))} placeholder="0" />
              </div>
              <div className="space-y-1.5">
                <Label>Category</Label>
                <Select value={expForm.category} onValueChange={(v) => setExpForm((p) => ({ ...p, category: v }))}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["LABOR", "SOFTWARE", "HARDWARE", "TRAVEL", "MARKETING", "OPERATIONS", "OTHER"].map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Date</Label>
              <Input type="date" value={expForm.date} onChange={(e) => setExpForm((p) => ({ ...p, date: e.target.value }))} className="h-9 text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea value={expForm.description} onChange={(e) => setExpForm((p) => ({ ...p, description: e.target.value }))} rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setExpenseOpen(false)} disabled={loading}>Cancel</Button>
            <Button onClick={handleSaveExpense} disabled={loading}>
              {loading ? <><Loader2 className="h-3.5 w-3.5 animate-spin mr-2" />Saving...</> : "Add Expense"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete expense */}
      <AlertDialog open={!!deleteExpTarget} onOpenChange={(o) => !o && setDeleteExpTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Expense</AlertDialogTitle>
            <AlertDialogDescription>Delete &quot;{deleteExpTarget?.title}&quot;?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteExpense} className="bg-destructive hover:bg-destructive/90" disabled={loading}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
