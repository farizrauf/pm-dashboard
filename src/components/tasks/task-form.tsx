"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Eye, FileText, Loader2, Paperclip, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createTask, updateTask, type TaskFormData } from "@/actions/tasks";
import { DocumentPreview, type DocumentMeta } from "@/components/tasks/document-preview";
import { toast } from "sonner";
import { formatBytes } from "@/lib/utils";

const MAX_DOC_SIZE = 10 * 1024 * 1024; // 10 MB
const MAX_DOCS = 10;

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

  // ─── Documents ────────────────────────────────────────────────────────────
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [savedDocs, setSavedDocs] = useState<DocumentMeta[]>([]);
  const [deletingDocId, setDeletingDocId] = useState<string | null>(null);
  const [preview, setPreview] = useState<{ doc: DocumentMeta; src: string } | null>(null);
  const previewObjectUrl = useRef<string | null>(null);

  const fetchSavedDocs = useCallback(async () => {
    if (!task?.id) {
      setSavedDocs([]);
      return;
    }
    try {
      const res = await fetch(`/api/tasks/${task.id}/documents`);
      if (res.ok) {
        const json = await res.json();
        setSavedDocs(json.documents ?? []);
      }
    } catch {
      // ignore — list simply stays empty
    }
  }, [task?.id]);

  useEffect(() => {
    fetchSavedDocs();
  }, [fetchSavedDocs]);

  const handleFilesSelected = (files: FileList | null) => {
    if (!files?.length) return;
    const accepted: File[] = [];
    for (const file of Array.from(files)) {
      if (file.size > MAX_DOC_SIZE) {
        toast.error(`"${file.name}" is too large. Max ${formatBytes(MAX_DOC_SIZE)}.`);
        continue;
      }
      accepted.push(file);
    }
    if (!accepted.length) return;
    setPendingFiles((prev) => {
      const next = [...prev, ...accepted];
      if (next.length + savedDocs.length > MAX_DOCS) {
        toast.error(`Maximum ${MAX_DOCS} documents per task`);
        return next.slice(0, Math.max(0, MAX_DOCS - savedDocs.length));
      }
      return next;
    });
  };

  const openPendingPreview = (file: File) => {
    const url = URL.createObjectURL(file);
    previewObjectUrl.current = url;
    setPreview({
      doc: { id: `local-${file.name}`, name: file.name, mimeType: file.type || "application/octet-stream", size: file.size },
      src: url,
    });
  };

  const closePreview = (open: boolean) => {
    if (!open) {
      setPreview(null);
      if (previewObjectUrl.current) {
        URL.revokeObjectURL(previewObjectUrl.current);
        previewObjectUrl.current = null;
      }
    }
  };

  const deleteSavedDoc = async (docId: string) => {
    setDeletingDocId(docId);
    try {
      const res = await fetch(`/api/task-documents/${docId}`, { method: "DELETE" });
      if (res.ok) {
        setSavedDocs((prev) => prev.filter((d) => d.id !== docId));
        toast.success("Document removed");
      } else {
        toast.error("Failed to remove document");
      }
    } catch {
      toast.error("Failed to remove document");
    } finally {
      setDeletingDocId(null);
    }
  };

  const uploadPendingFiles = async (taskId: string) => {
    if (!pendingFiles.length) return;
    const form = new FormData();
    pendingFiles.forEach((f) => form.append("files", f));
    const res = await fetch(`/api/tasks/${taskId}/documents`, { method: "POST", body: form });
    if (!res.ok) {
      const json = await res.json().catch(() => null);
      throw new Error(json?.error || "Document upload failed");
    }
  };

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
        return;
      }

      // Attach uploaded documents to the (new or existing) task
      const taskId = task?.id ?? ("task" in result ? (result.task as { id: string }).id : null);
      if (taskId && pendingFiles.length) {
        try {
          await uploadPendingFiles(taskId);
        } catch (err) {
          toast.error(err instanceof Error ? err.message : "Documents failed to upload");
        }
      }

      toast.success(task ? "Task updated" : "Task created");
      onSuccess?.();
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

      {/* Documents */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label className="flex items-center gap-1.5">
            <Paperclip className="h-3.5 w-3.5 text-muted-foreground" /> Documents
          </Label>
          <span className="text-[10px] text-muted-foreground">
            max {MAX_DOCS} files · {formatBytes(MAX_DOC_SIZE)} each
          </span>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => {
            handleFilesSelected(e.target.files);
            e.target.value = "";
          }}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-full h-8 text-xs border-dashed gap-1.5 font-normal text-muted-foreground"
          onClick={() => fileInputRef.current?.click()}
          disabled={pendingFiles.length + savedDocs.length >= MAX_DOCS}
        >
          <Upload className="h-3.5 w-3.5" /> Attach documents
        </Button>

        {(savedDocs.length > 0 || pendingFiles.length > 0) && (
          <ul className="space-y-1 pt-0.5">
            {savedDocs.map((doc) => (
              <li key={doc.id} className="flex items-center gap-2 rounded-md border border-border px-2 py-1.5 bg-muted/20">
                <FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <span className="text-xs truncate flex-1">{doc.name}</span>
                <span className="text-[10px] text-muted-foreground shrink-0">{formatBytes(doc.size)}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 shrink-0"
                  title="Preview"
                  onClick={() => setPreview({ doc, src: `/api/task-documents/${doc.id}` })}
                >
                  <Eye className="h-3.5 w-3.5" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 shrink-0 text-destructive hover:text-destructive"
                  title="Remove document"
                  onClick={() => deleteSavedDoc(doc.id)}
                  disabled={deletingDocId === doc.id}
                >
                  {deletingDocId === doc.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                </Button>
              </li>
            ))}
            {pendingFiles.map((file, i) => (
              <li key={`${file.name}-${i}`} className="flex items-center gap-2 rounded-md border border-primary/30 bg-primary/5 px-2 py-1.5">
                <FileText className="h-3.5 w-3.5 shrink-0 text-primary" />
                <span className="text-xs truncate flex-1">{file.name}</span>
                <span className="text-[10px] text-muted-foreground shrink-0">{formatBytes(file.size)}</span>
                <span className="text-[10px] text-primary shrink-0">new</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 shrink-0"
                  title="Preview"
                  onClick={() => openPendingPreview(file)}
                >
                  <Eye className="h-3.5 w-3.5" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 shrink-0 text-destructive hover:text-destructive"
                  title="Remove"
                  onClick={() => setPendingFiles((prev) => prev.filter((_, j) => j !== i))}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </li>
            ))}
          </ul>
        )}
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

      <DocumentPreview
        open={!!preview}
        onOpenChange={closePreview}
        document={preview?.doc ?? null}
        src={preview?.src ?? null}
      />
    </form>
  );
}
