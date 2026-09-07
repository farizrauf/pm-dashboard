"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createTask, updateTask, type TaskFormData } from "@/actions/tasks";
import { toast } from "sonner";

interface TaskFormProps {
  projectId?: string;
  task?: {
    id: string;
    title: string;
    description: string | null;
    status: string;
    priority: string;
    dueDate: Date | null;
    assigneeId: string | null;
    project?: { id: string; name: string; color: string } | null;
  };
  members?: { id: string; name: string | null; image: string | null }[];
  projects?: { id: string; name: string; color: string }[];
  defaultStatus?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function TaskForm({ projectId, task, members = [], projects = [], defaultStatus = "TODO", onSuccess, onCancel }: TaskFormProps) {
  const [isLoading, setIsLoading] = useState(false);

  const toDateInput = (d: Date | null | undefined) =>
    d ? new Date(d).toISOString().split("T")[0] : "";

  const [values, setValues] = useState({
    title: task?.title ?? "",
    description: task?.description ?? "",
    status: task?.status ?? defaultStatus,
    priority: task?.priority ?? "MEDIUM",
    assigneeId: task?.assigneeId ?? "",
    dueDate: toDateInput(task?.dueDate),
    selectedProjectId: projectId ?? task?.project?.id ?? "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!values.title.trim()) {
      toast.error("Title is required");
      return;
    }
    setIsLoading(true);
    try {
      const data: TaskFormData = {
        title: values.title.trim(),
        description: values.description || null,
        status: values.status as TaskFormData["status"],
        priority: values.priority as TaskFormData["priority"],
        projectId: values.selectedProjectId || projectId || null,
        assigneeId: values.assigneeId || null,
        dueDate: values.dueDate || null,
      };

      const result = task
        ? await updateTask(task.id, data)
        : await createTask(data);

      if ("error" in result && result.error) {
        toast.error(result.error);
      } else {
        toast.success(task ? "Task updated" : "Task created");
        onSuccess?.();
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="task-title">Title *</Label>
        <Input
          id="task-title"
          value={values.title}
          onChange={(e) => setValues((p) => ({ ...p, title: e.target.value }))}
          placeholder="Task title..."
          autoFocus
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="task-desc">Description</Label>
        <Textarea
          id="task-desc"
          value={values.description}
          onChange={(e) => setValues((p) => ({ ...p, description: e.target.value }))}
          placeholder="Add details..."
          rows={3}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Status</Label>
          <Select value={values.status} onValueChange={(v) => setValues((p) => ({ ...p, status: v }))}>
            <SelectTrigger className="h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="BACKLOG">Backlog</SelectItem>
              <SelectItem value="TODO">To Do</SelectItem>
              <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
              <SelectItem value="REVIEW">Review</SelectItem>
              <SelectItem value="DONE">Done</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Priority</Label>
          <Select value={values.priority} onValueChange={(v) => setValues((p) => ({ ...p, priority: v }))}>
            <SelectTrigger className="h-8 text-sm">
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

      <div className="grid grid-cols-2 gap-3">
        {projects.length > 0 && !projectId && (
          <div className="space-y-1.5 col-span-2">
            <Label>Project</Label>
            <Select value={values.selectedProjectId} onValueChange={(v) => setValues((p) => ({ ...p, selectedProjectId: v }))}>
              <SelectTrigger className="h-8 text-sm">
                <SelectValue placeholder="No project" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">No project</SelectItem>
                {projects.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        {members.length > 0 && (
          <div className="space-y-1.5">
            <Label>Assignee</Label>
            <Select value={values.assigneeId} onValueChange={(v) => setValues((p) => ({ ...p, assigneeId: v }))}>
              <SelectTrigger className="h-8 text-sm">
                <SelectValue placeholder="Unassigned" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Unassigned</SelectItem>
                {members.map((m) => (
                  <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        <div className="space-y-1.5">
          <Label>Due Date</Label>
          <Input
            type="date"
            value={values.dueDate}
            onChange={(e) => setValues((p) => ({ ...p, dueDate: e.target.value }))}
            className="h-8 text-sm"
          />
        </div>
      </div>

      <div className="flex gap-2 pt-1">
        <Button type="submit" size="sm" disabled={isLoading}>
          {isLoading ? <><Loader2 className="h-3.5 w-3.5 animate-spin" />{task ? "Saving..." : "Creating..."}</> : task ? "Save" : "Create Task"}
        </Button>
        {onCancel && (
          <Button type="button" variant="outline" size="sm" onClick={onCancel} disabled={isLoading}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}
