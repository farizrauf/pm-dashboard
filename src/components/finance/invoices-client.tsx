"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Plus, FileText, CheckCircle2, Send, XCircle,
  AlertTriangle, MoreHorizontal, Trash2, Loader2, ImagePlus, Image as ImageIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { createInvoice, updateInvoiceStatus, deleteInvoice, type InvoiceFormData } from "@/actions/invoices";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

type InvoiceItem = { id: string; description: string; quantity: number; unitPrice: number; total: number };
type Invoice = {
  id: string; invoiceNo: string; title: string; amount: number; status: string;
  issuedAt: Date; dueAt: Date | null; paidAt: Date | null; notes: string | null;
  image: string | null;
  items: InvoiceItem[];
  budget: { id: string; project: { id: string; name: string; color: string } };
};
type BudgetOption = { id: string; project: { name: string; color: string } };

const STATUS_CONFIG: Record<string, { label: string; icon: React.ElementType; cls: string }> = {
  DRAFT:     { label: "Draft",     icon: FileText,    cls: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400" },
  SENT:      { label: "Sent",      icon: Send,        cls: "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400" },
  PAID:      { label: "Paid",      icon: CheckCircle2,cls: "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400" },
  OVERDUE:   { label: "Overdue",   icon: AlertTriangle,cls:"bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400" },
  CANCELLED: { label: "Cancelled", icon: XCircle,     cls: "bg-muted text-muted-foreground" },
};

function fmt(n: number) { return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0 }).format(n); }

const emptyForm = { title: "", amount: "", status: "DRAFT", issuedAt: "", dueAt: "", notes: "", image: "", budgetId: "" };

export function InvoicesClient({ invoices: initial, budgets }: { invoices: Invoice[]; budgets: BudgetOption[] }) {
  const router = useRouter();
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [formOpen, setFormOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const filtered = filterStatus === "ALL" ? initial : initial.filter((i) => i.status === filterStatus);

  const stats = {
    total: initial.length,
    paid: initial.filter((i) => i.status === "PAID").reduce((s, i) => s + i.amount, 0),
    pending: initial.filter((i) => ["DRAFT", "SENT"].includes(i.status)).reduce((s, i) => s + i.amount, 0),
    overdue: initial.filter((i) => i.status === "OVERDUE").length,
  };

  const handleCreate = async () => {
    if (!form.title.trim() || !form.budgetId) { toast.error("Title and project are required"); return; }
    setLoading(true);
    try {
      const data: InvoiceFormData = {
        title: form.title, amount: parseFloat(form.amount) || 0,
        status: form.status as InvoiceFormData["status"],
        issuedAt: form.issuedAt || undefined,
        dueAt: form.dueAt || null,
        notes: form.notes || null,
        image: form.image || null,
        budgetId: form.budgetId,
      };
      const res = await createInvoice(data);
      if ("error" in res && res.error) { toast.error(res.error); return; }
      toast.success("Invoice created");
      setFormOpen(false);
      router.refresh();
    } catch { toast.error("Failed to create invoice"); }
    finally { setLoading(false); }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error("Please choose an image file"); return; }
    if (file.size > 2 * 1024 * 1024) { toast.error("Image must be under 2 MB"); return; }
    const reader = new FileReader();
    reader.onload = () => setForm((p) => ({ ...p, image: String(reader.result) }));
    reader.readAsDataURL(file);
  };

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await updateInvoiceStatus(id, status as "DRAFT" | "SENT" | "PAID" | "OVERDUE" | "CANCELLED");
      toast.success("Status updated");
      router.refresh();
    } catch { toast.error("Failed to update"); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setLoading(true);
    try {
      await deleteInvoice(deleteTarget.id);
      toast.success("Invoice deleted");
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
          { label: "Total Invoices", value: initial.length, display: String(initial.length) },
          { label: "Paid", value: stats.paid, display: fmt(stats.paid) },
          { label: "Pending", value: stats.pending, display: fmt(stats.pending) },
          { label: "Overdue", value: stats.overdue, display: String(stats.overdue) },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-border bg-card p-4">
            <p className="text-2xl font-bold">{s.display}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3 mb-5">
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="h-8 w-36 text-sm"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Statuses</SelectItem>
            {Object.entries(STATUS_CONFIG).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button size="sm" className="h-8 ml-auto gap-1.5" onClick={() => { setForm({ ...emptyForm, budgetId: budgets[0]?.id ?? "", issuedAt: format(new Date(), "yyyy-MM-dd") }); setFormOpen(true); }}>
          <Plus className="h-3.5 w-3.5" /> New Invoice
        </Button>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <FileText className="h-10 w-10 text-muted-foreground mb-3" />
          <p className="text-base font-medium">No invoices found</p>
          <p className="text-sm text-muted-foreground mt-1">Create your first invoice.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-border overflow-hidden bg-card">
          <div className="grid grid-cols-[80px_minmax(0,1fr)_130px_110px_100px_110px_40px] gap-2 px-4 py-2.5 border-b border-border bg-muted/30 text-xs font-medium text-muted-foreground">
            <span>No.</span><span>Title</span><span>Project</span><span>Status</span><span className="text-right">Amount</span><span>Due</span><span />
          </div>
          {filtered.map((inv) => {
            const cfg = STATUS_CONFIG[inv.status];
            const Icon = cfg.icon;
            return (
              <div key={inv.id} className="grid grid-cols-[80px_minmax(0,1fr)_130px_110px_100px_110px_40px] gap-2 px-4 py-3 border-b border-border last:border-0 hover:bg-accent/20 transition-colors group items-center">
                <span className="text-xs font-mono text-muted-foreground">{inv.invoiceNo}</span>
                <div className="flex items-center gap-2 min-w-0">
                  {inv.image ? (
                    <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-md border border-border">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={inv.image} alt={inv.title} className="h-full w-full object-cover" />
                    </div>
                  ) : (
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-muted/60">
                      <ImageIcon className="h-4 w-4 text-muted-foreground" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{inv.title}</p>
                    {inv.notes && <p className="text-xs text-muted-foreground truncate">{inv.notes}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="h-2 w-2 rounded-full shrink-0" style={{ background: inv.budget.project.color }} />
                  <span className="text-xs text-muted-foreground truncate">{inv.budget.project.name}</span>
                </div>
                <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium w-fit", cfg.cls)}>
                  <Icon className="h-3 w-3" />{cfg.label}
                </span>
                <span className="text-sm font-semibold text-right">{fmt(inv.amount)}</span>
                <span className="text-xs text-muted-foreground">{inv.dueAt ? format(new Date(inv.dueAt), "MMM d, yyyy") : "—"}</span>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity">
                      <MoreHorizontal className="h-3.5 w-3.5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem className="text-xs font-semibold text-muted-foreground" disabled>Change Status</DropdownMenuItem>
                    {Object.keys(STATUS_CONFIG).filter((s) => s !== inv.status).map((s) => (
                      <DropdownMenuItem key={s} onClick={() => handleStatusChange(inv.id, s)} className="gap-2 text-sm">
                        → {STATUS_CONFIG[s].label}
                      </DropdownMenuItem>
                    ))}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setDeleteTarget(inv)} className="gap-2 text-destructive focus:text-destructive">
                      <Trash2 className="h-3.5 w-3.5" /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            );
          })}
        </div>
      )}

      {/* Create dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>New Invoice</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Title *</Label>
              <Input value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} autoFocus />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Amount</Label>
                <Input type="number" min={0} value={form.amount} onChange={(e) => setForm((p) => ({ ...p, amount: e.target.value }))} placeholder="0" />
              </div>
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm((p) => ({ ...p, status: v }))}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(STATUS_CONFIG).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Issue Date</Label>
                <Input type="date" value={form.issuedAt} onChange={(e) => setForm((p) => ({ ...p, issuedAt: e.target.value }))} className="h-9 text-sm" />
              </div>
              <div className="space-y-1.5">
                <Label>Due Date</Label>
                <Input type="date" value={form.dueAt} onChange={(e) => setForm((p) => ({ ...p, dueAt: e.target.value }))} className="h-9 text-sm" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Project *</Label>
              <Select value={form.budgetId} onValueChange={(v) => setForm((p) => ({ ...p, budgetId: v }))}>
                <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Select project" /></SelectTrigger>
                <SelectContent>
                  {budgets.map((b) => <SelectItem key={b.id} value={b.id}>{b.project.name}</SelectItem>)}
                </SelectContent>
              </Select>
              {budgets.length === 0 && <p className="text-xs text-muted-foreground">Set a budget on a project first to create invoices.</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Notes</Label>
              <Textarea value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} rows={2} />
            </div>
            <div className="space-y-1.5">
              <Label>Invoice Image</Label>
              {form.image ? (
                <div className="relative overflow-hidden rounded-xl border border-border">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={form.image} alt="Invoice preview" className="max-h-44 w-full object-cover" />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="absolute top-2 right-2 h-7 text-xs"
                    onClick={() => setForm((p) => ({ ...p, image: "" }))}
                  >
                    Remove
                  </Button>
                </div>
              ) : (
                <label className="flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-border px-4 py-6 text-center hover:border-primary transition-colors">
                  <ImagePlus className="h-5 w-5 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Click to upload an image (max 2 MB)</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageChange}
                  />
                </label>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)} disabled={loading}>Cancel</Button>
            <Button onClick={handleCreate} disabled={loading || budgets.length === 0}>
              {loading ? <><Loader2 className="h-3.5 w-3.5 animate-spin mr-2" />Creating...</> : "Create Invoice"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Invoice</AlertDialogTitle>
            <AlertDialogDescription>Delete invoice &quot;{deleteTarget?.invoiceNo}&quot;? This cannot be undone.</AlertDialogDescription>
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
