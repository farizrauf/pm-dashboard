"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { CalendarDays, CheckCircle2, CircleDot, Flag, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { createProject, updateProject, type ProjectFormData } from "@/actions/projects";
import { toast } from "sonner";

const schema = z.object({
  name: z.string().min(1, "Project name is required").max(100),
  description: z.string().optional(),
  status: z.enum(["PLANNING", "ACTIVE", "ON_HOLD", "COMPLETED", "CANCELLED"]),
  priority: z.enum(["CRITICAL", "HIGH", "MEDIUM", "LOW"]),
  startDate: z.string().optional(),
  dueDate: z.string().optional(),
  color: z.string(),
});

const COLORS = [
  "#B4ABF4", "#BFD2D1", "#60A5FA", "#34D399", "#F59E0B",
  "#EF4444", "#8B5CF6", "#EC4899", "#14B8A6", "#F97316",
];

const STATUS_LABELS: Record<ProjectFormData["status"], string> = {
  PLANNING: "Planning",
  ACTIVE: "Active",
  ON_HOLD: "On Hold",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

const PRIORITY_LABELS: Record<ProjectFormData["priority"], string> = {
  CRITICAL: "Critical",
  HIGH: "High",
  MEDIUM: "Medium",
  LOW: "Low",
};

interface ProjectFormProps {
  project?: {
    id: string;
    name: string;
    description: string | null;
    status: string;
    priority: string;
    startDate: Date | null;
    dueDate: Date | null;
    color: string;
  };
}

export function ProjectForm({ project }: ProjectFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});

  const toDateInput = (d: Date | null | undefined) =>
    d ? new Date(d).toISOString().split("T")[0] : "";

  const [values, setValues] = useState({
    name: project?.name ?? "",
    description: project?.description ?? "",
    status: (project?.status ?? "PLANNING") as ProjectFormData["status"],
    priority: (project?.priority ?? "MEDIUM") as ProjectFormData["priority"],
    startDate: toDateInput(project?.startDate),
    dueDate: toDateInput(project?.dueDate),
    color: project?.color ?? "#B4ABF4",
  });

  const handleChange = (field: string, value: string) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse(values);
    if (!parsed.success) {
      const errs: Record<string, string> = {};
      parsed.error.errors.forEach((err) => {
        if (err.path[0]) errs[err.path[0] as string] = err.message;
      });
      setErrors(errs);
      return;
    }

    setIsLoading(true);
    try {
      const result = project
        ? await updateProject(project.id, parsed.data)
        : await createProject(parsed.data);

      if ("error" in result && result.error) {
        toast.error(result.error);
      } else {
        toast.success(project ? "Project updated" : "Project created");
        router.push(project ? `/projects/${project.id}` : "/projects");
        router.refresh();
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="grid max-w-6xl grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1.7fr)_minmax(280px,1fr)]">
      <Card>
        <CardHeader>
          <CardTitle>{project ? "Edit Project" : "New Project"}</CardTitle>
          <CardDescription>
            {project ? "Update project details" : "Create a new project for your team"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <Label htmlFor="name">Project Name *</Label>
            <Input
              id="name"
              value={values.name}
              onChange={(e) => handleChange("name", e.target.value)}
              placeholder="e.g. Website Redesign"
              className={errors.name ? "border-destructive" : ""}
            />
            {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={values.description}
              onChange={(e) => handleChange("description", e.target.value)}
              placeholder="Describe the project goals and scope..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={values.status} onValueChange={(v) => handleChange("status", v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PLANNING">Planning</SelectItem>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="ON_HOLD">On Hold</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Priority</Label>
              <Select value={values.priority} onValueChange={(v) => handleChange("priority", v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CRITICAL">Critical</SelectItem>
                  <SelectItem value="HIGH">High</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="LOW">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={values.startDate}
                onChange={(e) => handleChange("startDate", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="dueDate">Due Date</Label>
              <Input
                id="dueDate"
                type="date"
                value={values.dueDate}
                onChange={(e) => handleChange("dueDate", e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Project Color</Label>
            <div className="flex gap-2 flex-wrap">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  className={`h-7 w-7 rounded-full border-2 transition-all ${
                    values.color === c ? "border-foreground scale-110" : "border-transparent hover:scale-105"
                  }`}
                  style={{ background: c }}
                  onClick={() => handleChange("color", c)}
                />
              ))}
            </div>
          </div>

            <div className="flex gap-3 border-t border-border pt-5">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? <><Loader2 className="h-4 w-4 animate-spin" />{project ? "Saving..." : "Creating..."}</> : project ? "Save Changes" : "Create Project"}
              </Button>
              <Button type="button" variant="outline" onClick={() => router.back()} disabled={isLoading}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <aside className="space-y-4 xl:sticky xl:top-6">
        <Card className="overflow-hidden">
          <div className="h-2" style={{ background: values.color }} />
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle className="text-base">Project preview</CardTitle>
                <CardDescription>See how your project will appear.</CardDescription>
              </div>
              <div className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ background: `${values.color}28`, color: values.color }}>
                <CircleDot className="h-5 w-5" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-lg font-semibold leading-tight">{values.name.trim() || "Untitled project"}</p>
              <p className="mt-1 line-clamp-3 min-h-[3.75rem] text-sm text-muted-foreground">
                {values.description.trim() || "Add a short description to help your team understand the project scope."}
              </p>
            </div>
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 font-medium">
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: values.color }} />
                {STATUS_LABELS[values.status]}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-muted-foreground">
                <Flag className="h-3 w-3" /> {PRIORITY_LABELS[values.priority]}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 border-t border-border pt-3">
              <div className="rounded-lg bg-muted/40 p-2.5">
                <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground"><CalendarDays className="h-3 w-3" /> Start date</p>
                <p className="mt-1 text-sm font-medium">{values.startDate || "Not set"}</p>
              </div>
              <div className="rounded-lg bg-muted/40 p-2.5">
                <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground"><CalendarDays className="h-3 w-3" /> Due date</p>
                <p className="mt-1 text-sm font-medium">{values.dueDate || "Not set"}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base"><Sparkles className="h-4 w-4 text-primary" /> Project setup</CardTitle>
            <CardDescription>A few details make collaboration easier.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              [Boolean(values.name.trim()), "Give the project a clear name"],
              [Boolean(values.description.trim()), "Add goals or project scope"],
              [Boolean(values.startDate && values.dueDate), "Set a project timeline"],
            ].map(([complete, label]) => (
              <div key={label as string} className="flex items-start gap-2.5 text-sm">
                <CheckCircle2 className={`mt-0.5 h-4 w-4 shrink-0 ${complete ? "text-emerald-500" : "text-muted-foreground/40"}`} />
                <span className={complete ? "text-foreground" : "text-muted-foreground"}>{label as string}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </aside>
    </div>
  );
}
