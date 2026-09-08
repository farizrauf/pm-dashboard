"use client";

import { useState, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Search, Grid3x3, List, SlidersHorizontal, MoreHorizontal, Trash2, Pencil, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { deleteProject } from "@/actions/projects";
import { toast } from "sonner";
import Link from "next/link";
import { cn, formatDate, getInitials, STATUS_COLORS, STATUS_LABELS, PRIORITY_COLORS, PRIORITY_LABELS, calculateProgress } from "@/lib/utils";

type Project = {
  id: string;
  name: string;
  description: string | null;
  status: string;
  priority: string;
  dueDate: Date | null;
  color: string;
  updatedAt: Date;
  members: { user: { id: string; name: string | null; image: string | null } }[];
  tasks: { id: string; status: string }[];
  _count: { tasks: number; milestones: number };
};

interface ProjectsClientProps {
  initialProjects: Project[];
  total: number;
  pages: number;
  searchParams: Record<string, string | undefined>;
}

export function ProjectsClient({ initialProjects, total: _total, pages, searchParams }: ProjectsClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [view, setView] = useState<"grid" | "list">("grid");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const updateSearch = useCallback((key: string, value: string) => {
    const cleanParams: Record<string, string> = {};
    Object.entries(searchParams).forEach(([k, v]) => {
      if (v !== undefined && v !== null) cleanParams[k] = v;
    });
    const params = new URLSearchParams(cleanParams);
    if (value && value !== "ALL") {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    if (key !== "page") params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  }, [router, pathname, searchParams]);

  const handleDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      await deleteProject(deleteId);
      toast.success("Project deleted");
      router.refresh();
    } catch {
      toast.error("Failed to delete project");
    } finally {
      setIsDeleting(false);
      setDeleteId(null);
    }
  };

  return (
    <>
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search projects..."
            className="pl-8 h-8 text-sm"
            defaultValue={searchParams.search ?? ""}
            onChange={(e) => updateSearch("search", e.target.value)}
          />
        </div>
        <Select
          defaultValue={searchParams.status ?? "ALL"}
          onValueChange={(v) => updateSearch("status", v)}
        >
          <SelectTrigger className="h-8 w-36 text-sm">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All statuses</SelectItem>
            <SelectItem value="PLANNING">Planning</SelectItem>
            <SelectItem value="ACTIVE">Active</SelectItem>
            <SelectItem value="ON_HOLD">On Hold</SelectItem>
            <SelectItem value="COMPLETED">Completed</SelectItem>
            <SelectItem value="CANCELLED">Cancelled</SelectItem>
          </SelectContent>
        </Select>
        <Select
          defaultValue={searchParams.priority ?? "ALL"}
          onValueChange={(v) => updateSearch("priority", v)}
        >
          <SelectTrigger className="h-8 w-36 text-sm">
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All priorities</SelectItem>
            <SelectItem value="CRITICAL">Critical</SelectItem>
            <SelectItem value="HIGH">High</SelectItem>
            <SelectItem value="MEDIUM">Medium</SelectItem>
            <SelectItem value="LOW">Low</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex gap-1 ml-auto">
          <Button
            variant={view === "grid" ? "secondary" : "ghost"}
            size="icon"
            className="h-8 w-8"
            onClick={() => setView("grid")}
          >
            <Grid3x3 className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant={view === "list" ? "secondary" : "ghost"}
            size="icon"
            className="h-8 w-8"
            onClick={() => setView("list")}
          >
            <List className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Projects */}
      {initialProjects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3">
            <SlidersHorizontal className="h-5 w-5 text-muted-foreground" />
          </div>
          <p className="text-base font-medium">No projects found</p>
          <p className="text-sm text-muted-foreground mt-1">Try adjusting your filters or create a new project.</p>
          <Button size="sm" className="mt-4" asChild>
            <Link href="/projects/new">Create Project</Link>
          </Button>
        </div>
      ) : view === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {initialProjects.map((p) => (
            <ProjectCard key={p.id} project={p} onDelete={() => setDeleteId(p.id)} />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {initialProjects.map((p) => (
            <ProjectRow key={p.id} project={p} onDelete={() => setDeleteId(p.id)} />
          ))}
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
                type="button"
                variant={page === current ? "default" : "outline"}
                size="sm"
                className="h-7 w-7 p-0 text-xs"
                onClick={(e) => { e.preventDefault(); updateSearch("page", String(page)); }}
              >
                {page}
              </Button>
            );
          })}
        </div>
      )}

      {/* Delete dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete project?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the project and all its tasks, milestones, and activity. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function ProjectCard({ project, onDelete }: { project: Project; onDelete: () => void }) {
  const done = project.tasks.filter((t) => t.status === "DONE").length;
  const progress = calculateProgress(done, project.tasks.length);
  const statusStyle = STATUS_COLORS[project.status as keyof typeof STATUS_COLORS];
  const priorityStyle = PRIORITY_COLORS[project.priority as keyof typeof PRIORITY_COLORS];

  return (
    <Card className="hover:shadow-md transition-all group">
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="h-3 w-3 rounded-full shrink-0" style={{ background: project.color }} />
            <Link href={`/projects/${project.id}`} className="font-semibold text-sm truncate hover:text-primary transition-colors">
              {project.name}
            </Link>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                <MoreHorizontal className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/projects/${project.id}`} className="gap-2">
                  <ExternalLink className="h-3.5 w-3.5" /> Open
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/projects/${project.id}/edit`} className="gap-2">
                  <Pencil className="h-3.5 w-3.5" /> Edit
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="gap-2 text-destructive focus:text-destructive" onClick={onDelete}>
                <Trash2 className="h-3.5 w-3.5" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {project.description && (
          <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{project.description}</p>
        )}

        <div className="flex gap-1.5 mb-4">
          <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium", statusStyle?.bg, statusStyle?.text)}>
            {STATUS_LABELS[project.status] ?? project.status}
          </span>
          <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium", priorityStyle?.bg, priorityStyle?.text)}>
            {PRIORITY_LABELS[project.priority] ?? project.priority}
          </span>
        </div>

        <div className="space-y-1.5 mb-4">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Progress</span>
            <span className="font-medium text-foreground">{progress}%</span>
          </div>
          <Progress value={progress} className="h-1" />
          <p className="text-[11px] text-muted-foreground">{done} / {project.tasks.length} tasks</p>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex -space-x-1.5">
            {project.members.slice(0, 4).map((m) => (
              <Avatar key={m.user.id} className="h-5 w-5 border-2 border-card">
                <AvatarImage src={m.user.image ?? ""} />
                <AvatarFallback className="text-[8px]">{getInitials(m.user.name)}</AvatarFallback>
              </Avatar>
            ))}
            {project.members.length > 4 && (
              <div className="h-5 w-5 rounded-full bg-muted border-2 border-card flex items-center justify-center text-[8px] text-muted-foreground font-medium">
                +{project.members.length - 4}
              </div>
            )}
          </div>
          {project.dueDate && (
            <span className="text-[11px] text-muted-foreground">Due {formatDate(project.dueDate)}</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function ProjectRow({ project, onDelete }: { project: Project; onDelete: () => void }) {
  const done = project.tasks.filter((t) => t.status === "DONE").length;
  const progress = calculateProgress(done, project.tasks.length);
  const statusStyle = STATUS_COLORS[project.status as keyof typeof STATUS_COLORS];

  return (
    <div className="flex items-center gap-4 px-4 py-3 rounded-lg border border-border bg-card hover:shadow-sm transition-all group">
      <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: project.color }} />
      <Link href={`/projects/${project.id}`} className="flex-1 min-w-0 font-medium text-sm hover:text-primary transition-colors truncate">
        {project.name}
      </Link>
      <span className={cn("hidden sm:inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium shrink-0", statusStyle?.bg, statusStyle?.text)}>
        {STATUS_LABELS[project.status] ?? project.status}
      </span>
      <div className="hidden md:flex items-center gap-2 w-32 shrink-0">
        <Progress value={progress} className="h-1 flex-1" />
        <span className="text-xs text-muted-foreground w-8 text-right">{progress}%</span>
      </div>
      <div className="hidden lg:flex -space-x-1.5 shrink-0">
        {project.members.slice(0, 3).map((m) => (
          <Avatar key={m.user.id} className="h-5 w-5 border-2 border-card">
            <AvatarImage src={m.user.image ?? ""} />
            <AvatarFallback className="text-[8px]">{getInitials(m.user.name)}</AvatarFallback>
          </Avatar>
        ))}
      </div>
      {project.dueDate && (
        <span className="hidden lg:block text-xs text-muted-foreground shrink-0">{formatDate(project.dueDate)}</span>
      )}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
            <MoreHorizontal className="h-3.5 w-3.5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem asChild>
            <Link href={`/projects/${project.id}`} className="gap-2">
              <ExternalLink className="h-3.5 w-3.5" /> Open
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href={`/projects/${project.id}/edit`} className="gap-2">
              <Pencil className="h-3.5 w-3.5" /> Edit
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="gap-2 text-destructive focus:text-destructive" onClick={onDelete}>
            <Trash2 className="h-3.5 w-3.5" /> Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
