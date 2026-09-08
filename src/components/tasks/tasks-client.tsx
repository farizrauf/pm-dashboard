"use client";

import { useState, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  Plus, Search, List, Grid3x3, MoreHorizontal, Trash2, Pencil,
  ChevronUp, ChevronDown, ChevronsUpDown,
  Upload, X, RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import { TaskForm } from "@/components/tasks/task-form";
import { StatusBadge, PriorityBadge } from "@/components/tasks/task-badge";
import { deleteTask, bulkDeleteTasks, bulkUpdateTasks } from "@/actions/tasks";
import { ExportButton } from "@/components/shared/export-button";
import { ImportDialog } from "@/components/shared/import-dialog";
import { toast } from "sonner";
import { cn, formatDate, getInitials } from "@/lib/utils";
import { useTranslations } from "next-intl";

type Task = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  dueDate: Date | null;
  assigneeId: string | null;
  createdAt: Date;
  updatedAt: Date;
  completedAt: Date | null;
  assignee?: { id: string; name: string | null; image: string | null } | null;
  project?: { id: string; name: string; color: string } | null;
  labels?: { label: { id: string; name: string; color: string } }[];
  _count?: { comments: number };
};

interface TasksClientProps {
  initialTasks: Task[];
  total: number;
  pages: number;
  projects: { id: string; name: string; color: string }[];
  searchParams: Record<string, string | undefined>;
}

type SortKey = "title" | "status" | "priority" | "dueDate" | "createdAt";

export function TasksClient({ initialTasks, total: _total, pages, projects, searchParams }: TasksClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations("tasks");
  const tc = useTranslations("common");

  // URL-synced view state
  const [view, setView] = useState<"list" | "board">(
    searchParams.view === "board" ? "board" : "list"
  );
  const [addOpen, setAddOpen] = useState(false);
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>("createdAt");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  // Bulk selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [importOpen, setImportOpen] = useState(false);

  const updateParam = useCallback((key: string, value: string) => {
    const params = new URLSearchParams(searchParams as Record<string, string>);
    if (value && value !== "ALL") {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    if (key !== "page") params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  }, [router, pathname, searchParams]);

  // Sync view to URL
  const handleViewChange = (v: "list" | "board") => {
    setView(v);
    const params = new URLSearchParams(searchParams as Record<string, string>);
    if (v === "board") params.set("view", "board");
    else params.delete("view");
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(d => d === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const sortedTasks = [...initialTasks].sort((a, b) => {
    let cmp = 0;
    if (sortKey === "title") cmp = a.title.localeCompare(b.title);
    else if (sortKey === "status") cmp = a.status.localeCompare(b.status);
    else if (sortKey === "priority") {
      const order = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
      cmp = (order[a.priority as keyof typeof order] ?? 2) - (order[b.priority as keyof typeof order] ?? 2);
    }
    else if (sortKey === "dueDate") cmp = (a.dueDate?.getTime() ?? 0) - (b.dueDate?.getTime() ?? 0);
    else cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    return sortDir === "asc" ? cmp : -cmp;
  });

  // Selection helpers
  const allSelected = sortedTasks.length > 0 && sortedTasks.every((t) => selectedIds.has(t.id));
  const someSelected = selectedIds.size > 0;

  const toggleAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(sortedTasks.map((t) => t.id)));
    }
  };

  const toggleOne = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteTask(deleteId);
      toast.success(t("taskDeleted"));
      router.refresh();
    } catch {
      toast.error("Failed to delete task");
    } finally {
      setDeleteId(null);
    }
  };

  const handleBulkDelete = async () => {
    setBulkLoading(true);
    try {
      const result = await bulkDeleteTasks([...selectedIds]);
      toast.success(`${result.count} ${t("taskDeleted")}`);
      setSelectedIds(new Set());
      router.refresh();
    } catch {
      toast.error("Bulk delete failed");
    } finally {
      setBulkLoading(false);
      setBulkDeleteOpen(false);
    }
  };

  const handleBulkUpdateStatus = async (status: string) => {
    setBulkLoading(true);
    try {
      const result = await bulkUpdateTasks([...selectedIds], { status });
      toast.success(`${result.count} tasks updated`);
      setSelectedIds(new Set());
      router.refresh();
    } catch {
      toast.error("Failed to update tasks");
    } finally {
      setBulkLoading(false);
    }
  };

  const handleBulkUpdatePriority = async (priority: string) => {
    setBulkLoading(true);
    try {
      const result = await bulkUpdateTasks([...selectedIds], { priority });
      toast.success(`${result.count} tasks updated`);
      setSelectedIds(new Set());
      router.refresh();
    } catch {
      toast.error("Failed to update tasks");
    } finally {
      setBulkLoading(false);
    }
  };

  const SortIcon = ({ k }: { k: SortKey }) => {
    if (sortKey !== k) return <ChevronsUpDown className="h-3 w-3 text-muted-foreground/50" />;
    return sortDir === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />;
  };

  return (
    <>
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder={t("searchPlaceholder")}
            className="pl-8 h-8 text-sm"
            defaultValue={searchParams.search ?? ""}
            onChange={(e) => updateParam("search", e.target.value)}
          />
        </div>
        <Select defaultValue={searchParams.status ?? "ALL"} onValueChange={(v) => updateParam("status", v)}>
          <SelectTrigger className="h-8 w-36 text-sm"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">{tc("all")} Status</SelectItem>
            <SelectItem value="BACKLOG">Backlog</SelectItem>
            <SelectItem value="TODO">To Do</SelectItem>
            <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
            <SelectItem value="REVIEW">Review</SelectItem>
            <SelectItem value="DONE">Done</SelectItem>
          </SelectContent>
        </Select>
        <Select defaultValue={searchParams.priority ?? "ALL"} onValueChange={(v) => updateParam("priority", v)}>
          <SelectTrigger className="h-8 w-36 text-sm"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">{tc("all")} Priority</SelectItem>
            <SelectItem value="CRITICAL">Critical</SelectItem>
            <SelectItem value="HIGH">High</SelectItem>
            <SelectItem value="MEDIUM">Medium</SelectItem>
            <SelectItem value="LOW">Low</SelectItem>
          </SelectContent>
        </Select>
        {projects.length > 0 && (
          <Select defaultValue={searchParams.project ?? "ALL"} onValueChange={(v) => updateParam("project", v)}>
            <SelectTrigger className="h-8 w-36 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">{t("allProjects")}</SelectItem>
              {projects.map((p) => (
                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <div className="flex items-center gap-1 ml-auto flex-wrap">
          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-1.5 text-xs"
            onClick={() => setImportOpen(true)}
          >
            <Upload className="h-3.5 w-3.5" />
            {t("importTasks")}
          </Button>
          <ExportButton
            type="tasks"
            filters={{
              status: searchParams.status,
              priority: searchParams.priority,
              projectId: searchParams.project,
              search: searchParams.search,
            }}
          />
          <Button
            variant={view === "list" ? "secondary" : "ghost"}
            size="icon"
            className="h-8 w-8"
            onClick={() => handleViewChange("list")}
            title={t("listView")}
          >
            <List className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant={view === "board" ? "secondary" : "ghost"}
            size="icon"
            className="h-8 w-8"
            onClick={() => handleViewChange("board")}
            title={t("boardView")}
          >
            <Grid3x3 className="h-3.5 w-3.5" />
          </Button>
          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="h-8 ml-1">
                <Plus className="h-3.5 w-3.5 mr-1" /> {t("newTask")}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>{t("newTask")}</DialogTitle></DialogHeader>
              <TaskForm
                projects={projects}
                onSuccess={() => { setAddOpen(false); router.refresh(); }}
                onCancel={() => setAddOpen(false)}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Bulk action bar */}
      {someSelected && (
        <div className="flex items-center gap-2 mb-4 p-2.5 rounded-lg bg-primary/5 border border-primary/20">
          <span className="text-sm font-medium text-primary">
            {selectedIds.size} {selectedIds.size === 1 ? "task" : "tasks"} selected
          </span>
          <div className="flex items-center gap-1.5 ml-2 flex-wrap">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-7 text-xs gap-1" disabled={bulkLoading}>
                  <RefreshCw className="h-3 w-3" /> {t("bulkUpdateStatus")}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {["BACKLOG", "TODO", "IN_PROGRESS", "REVIEW", "DONE"].map((s) => (
                  <DropdownMenuItem key={s} onClick={() => handleBulkUpdateStatus(s)}>
                    {s.replace("_", " ")}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-7 text-xs gap-1" disabled={bulkLoading}>
                  <ChevronUp className="h-3 w-3" /> {t("bulkUpdatePriority")}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {["CRITICAL", "HIGH", "MEDIUM", "LOW"].map((p) => (
                  <DropdownMenuItem key={p} onClick={() => handleBulkUpdatePriority(p)}>
                    {p}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs gap-1 text-destructive hover:text-destructive border-destructive/30 hover:bg-destructive/5"
              onClick={() => setBulkDeleteOpen(true)}
              disabled={bulkLoading}
            >
              <Trash2 className="h-3 w-3" /> {t("bulkDelete")}
            </Button>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 ml-auto"
            onClick={() => setSelectedIds(new Set())}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}

      {/* List view */}
      {view === "list" && (
        <>
          {sortedTasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3">
                <List className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="text-base font-medium">{t("noTasks")}</p>
              <p className="text-sm text-muted-foreground mt-1">{t("noTasksHint")}</p>
            </div>
          ) : (
            <div className="rounded-xl border border-border overflow-hidden bg-card">
              {/* Table header */}
              <div className="grid grid-cols-[32px_minmax(0,1fr)_120px_100px_120px_120px_40px] gap-2 px-4 py-2.5 border-b border-border bg-muted/30 text-xs font-medium text-muted-foreground">
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={toggleAll}
                  aria-label="Select all tasks"
                  className="mt-0.5"
                />
                <button className="flex items-center gap-1 text-left" onClick={() => handleSort("title")}>
                  {tc("name")} <SortIcon k="title" />
                </button>
                <button className="flex items-center gap-1" onClick={() => handleSort("status")}>
                  {tc("status")} <SortIcon k="status" />
                </button>
                <button className="flex items-center gap-1" onClick={() => handleSort("priority")}>
                  {tc("priority")} <SortIcon k="priority" />
                </button>
                <span>{t("assignee")}</span>
                <button className="flex items-center gap-1" onClick={() => handleSort("dueDate")}>
                  {tc("dueDate")} <SortIcon k="dueDate" />
                </button>
                <span />
              </div>

              {sortedTasks.map((task) => (
                <div
                  key={task.id}
                  className={cn(
                    "grid grid-cols-[32px_minmax(0,1fr)_120px_100px_120px_120px_40px] gap-2 px-4 py-3 border-b border-border last:border-0 hover:bg-accent/30 transition-colors group items-center",
                    selectedIds.has(task.id) && "bg-primary/5"
                  )}
                >
                  <Checkbox
                    checked={selectedIds.has(task.id)}
                    onCheckedChange={() => toggleOne(task.id)}
                    aria-label={`Select ${task.title}`}
                    className="mt-0.5"
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      {task.project && (
                        <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ background: task.project.color }} />
                      )}
                      <span className={cn("text-sm font-medium truncate", task.status === "DONE" && "line-through text-muted-foreground")}>
                        {task.title}
                      </span>
                    </div>
                    {task.project && (
                      <p className="text-xs text-muted-foreground mt-0.5 ml-3.5">{task.project.name}</p>
                    )}
                  </div>
                  <StatusBadge status={task.status} />
                  <PriorityBadge priority={task.priority} />
                  <div>
                    {task.assignee ? (
                      <div className="flex items-center gap-1.5">
                        <Avatar className="h-5 w-5">
                          <AvatarImage src={task.assignee.image ?? ""} />
                          <AvatarFallback className="text-[8px]">{getInitials(task.assignee.name)}</AvatarFallback>
                        </Avatar>
                        <span className="text-xs text-muted-foreground truncate">{task.assignee.name}</span>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </div>
                  <span className={cn(
                    "text-xs",
                    task.dueDate && new Date(task.dueDate) < new Date() && task.status !== "DONE"
                      ? "text-destructive font-medium"
                      : "text-muted-foreground"
                  )}>
                    {formatDate(task.dueDate)}
                  </span>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity">
                        <MoreHorizontal className="h-3.5 w-3.5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setEditTask(task)} className="gap-2">
                        <Pencil className="h-3.5 w-3.5" /> {tc("edit")}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => setDeleteId(task.id)} className="gap-2 text-destructive focus:text-destructive">
                        <Trash2 className="h-3.5 w-3.5" /> {tc("delete")}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Board view (read-only grouping) */}
      {view === "board" && (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {["BACKLOG", "TODO", "IN_PROGRESS", "REVIEW", "DONE"].map((status) => {
            const colTasks = sortedTasks.filter((t) => t.status === status);
            return (
              <div key={status} className="shrink-0 w-64">
                <div className="flex items-center gap-2 mb-3 px-1">
                  <StatusBadge status={status} />
                  <span className="text-xs text-muted-foreground ml-auto">{colTasks.length}</span>
                </div>
                <div className="space-y-2">
                  {colTasks.map((task) => (
                    <div key={task.id} className="bg-card rounded-lg p-3 border border-border shadow-sm group">
                      <p className={cn("text-sm font-medium", task.status === "DONE" && "line-through text-muted-foreground")}>
                        {task.title}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <PriorityBadge priority={task.priority} />
                        {task.dueDate && <span className="text-[10px] text-muted-foreground">{formatDate(task.dueDate)}</span>}
                        {task.assignee && (
                          <Avatar className="h-4 w-4 ml-auto">
                            <AvatarImage src={task.assignee.image ?? ""} />
                            <AvatarFallback className="text-[7px]">{getInitials(task.assignee.name)}</AvatarFallback>
                          </Avatar>
                        )}
                      </div>
                    </div>
                  ))}
                  {colTasks.length === 0 && (
                    <div className="h-16 rounded-lg bg-muted/30 flex items-center justify-center text-xs text-muted-foreground">
                      {t("noTasks")}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          {Array.from({ length: pages }).map((_, i) => {
            const page = i + 1;
            const current = parseInt(searchParams.page ?? "1");
            return (
              <Button
                key={page}
                variant={page === current ? "default" : "outline"}
                size="sm"
                className="h-7 w-7 p-0 text-xs"
                onClick={() => updateParam("page", String(page))}
              >
                {page}
              </Button>
            );
          })}
        </div>
      )}

      {/* Edit dialog */}
      {editTask && (
        <Dialog open={!!editTask} onOpenChange={(o) => !o && setEditTask(null)}>
          <DialogContent>
            <DialogHeader><DialogTitle>{t("editTask")}</DialogTitle></DialogHeader>
            <TaskForm
              task={editTask}
              projects={projects}
              onSuccess={() => { setEditTask(null); router.refresh(); }}
              onCancel={() => setEditTask(null)}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Single delete confirm */}
      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("deleteTask")}</AlertDialogTitle>
            <AlertDialogDescription>{t("deleteConfirm")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tc("cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
              {tc("delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk delete confirm */}
      <AlertDialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("bulkDelete")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("bulkDeleteConfirm", { count: selectedIds.size })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tc("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              className="bg-destructive hover:bg-destructive/90"
              disabled={bulkLoading}
            >
              {bulkLoading ? "Deleting..." : tc("delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Import dialog */}
      <ImportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        type="tasks"
        projects={projects}
        onSuccess={() => { setImportOpen(false); router.refresh(); }}
      />
    </>
  );
}
