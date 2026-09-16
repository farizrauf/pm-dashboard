"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Calendar,
  Download,
  Eye,
  FileText,
  Loader2,
  Paperclip,
  Trash2,
  Upload,
  User,
  FolderKanban,
  MessageSquare,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { StatusBadge, PriorityBadge } from "@/components/tasks/task-badge";
import { DocumentPreview, type DocumentMeta } from "@/components/tasks/document-preview";
import { toast } from "sonner";
import { cn, formatBytes, formatDate, getInitials } from "@/lib/utils";

const MAX_DOC_SIZE = 10 * 1024 * 1024;
const MAX_DOCS = 10;

type TaskDetail = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  dueDate: string | null;
  createdAt: string;
  assignee: { id: string; name: string | null; image: string | null } | null;
  creator: { id: string; name: string | null; image: string | null };
  project: { id: string; name: string; color: string } | null;
  labels: { label: { id: string; name: string; color: string } }[];
  documents: DocumentMeta[];
  comments: { id: string; content: string; createdAt: string; author: { id: string; name: string | null; image: string | null } }[];
};

interface TaskDetailDialogProps {
  taskId: string | null;
  onOpenChange: (open: boolean) => void;
  /** Called after a mutation so the list can refresh. */
  onChanged?: () => void;
}

export function TaskDetailDialog({ taskId, onOpenChange, onChanged }: TaskDetailDialogProps) {
  const [task, setTask] = useState<TaskDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<{ doc: DocumentMeta; src: string } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async (id: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/tasks/${id}`);
      if (!res.ok) {
        setTask(null);
        return;
      }
      const json = await res.json();
      setTask(json.task);
    } finally {
      setLoading(false);
    }
  }, []);

  // Reload whenever the dialog opens with a new id
  useEffect(() => {
    if (taskId) load(taskId);
    else setTask(null);
  }, [taskId, load]);

  const uploadFiles = async (files: FileList | null) => {
    if (!files?.length || !task) return;
    const next = Array.from(files);
    const valid = next.filter((f) => f.size <= MAX_DOC_SIZE);
    const skipped = next.length - valid.length;
    if (skipped) toast.error(`${skipped} file(s) skipped — max ${formatBytes(MAX_DOC_SIZE)} each`);

    if (task.documents.length + valid.length > MAX_DOCS) {
      toast.error(`Maximum ${MAX_DOCS} documents per task`);
      return;
    }

    setUploading(true);
    try {
      const form = new FormData();
      valid.forEach((f) => form.append("files", f));
      const res = await fetch(`/api/tasks/${task.id}/documents`, { method: "POST", body: form });
      if (!res.ok) {
        const json = await res.json().catch(() => null);
        throw new Error(json?.error || "Upload failed");
      }
      const json = await res.json();
      setTask({ ...task, documents: [...task.documents, ...json.documents] });
      toast.success("Documents uploaded");
      onChanged?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const deleteDoc = async (docId: string) => {
    if (!task) return;
    setDeletingId(docId);
    try {
      const res = await fetch(`/api/task-documents/${docId}`, { method: "DELETE" });
      if (res.ok) {
        setTask({ ...task, documents: task.documents.filter((d) => d.id !== docId) });
        toast.success("Document removed");
        onChanged?.();
      } else {
        toast.error("Failed to remove document");
      }
    } catch {
      toast.error("Failed to remove document");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <Dialog open={!!taskId} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-base">Task Details</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center h-40 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : !task ? (
          <div className="text-sm text-muted-foreground text-center py-10">Task not found.</div>
        ) : (
          <ScrollArea className="max-h-[70vh] pr-3">
            <div className="space-y-4">
              {/* Title + badges */}
              <div>
                <h3 className="text-lg font-semibold leading-snug">{task.title}</h3>
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <StatusBadge status={task.status} />
                  <PriorityBadge priority={task.priority} />
                  {task.project && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                      <span className="h-1.5 w-1.5 rounded-full" style={{ background: task.project.color }} />
                      {task.project.name}
                    </span>
                  )}
                </div>
                {task.labels.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {task.labels.map(({ label }) => (
                      <Badge
                        key={label.id}
                        variant="outline"
                        className="text-[10px] font-medium"
                        style={{ borderColor: label.color, color: label.color }}
                      >
                        {label.name}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Description */}
              {task.description && (
                <div className="rounded-lg border border-border bg-muted/20 p-3">
                  <p className="text-sm whitespace-pre-wrap text-foreground/90">{task.description}</p>
                </div>
              )}

              {/* Meta grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <MetaItem icon={<User className="h-3.5 w-3.5 text-muted-foreground" />} label="Assignee">
                  {task.assignee ? (
                    <span className="inline-flex items-center gap-1.5">
                      <Avatar className="h-5 w-5">
                        <AvatarImage src={task.assignee.image ?? ""} />
                        <AvatarFallback className="text-[8px]">{getInitials(task.assignee.name)}</AvatarFallback>
                      </Avatar>
                      <span className="text-sm">{task.assignee.name}</span>
                    </span>
                  ) : (
                    <span className="text-sm text-muted-foreground">Unassigned</span>
                  )}
                </MetaItem>
                <MetaItem icon={<User className="h-3.5 w-3.5 text-muted-foreground" />} label="Created by">
                  <span className="text-sm">{task.creator.name ?? "—"}</span>
                </MetaItem>
                <MetaItem icon={<Calendar className="h-3.5 w-3.5 text-muted-foreground" />} label="Due date">
                  <span className={cn("text-sm", task.dueDate && new Date(task.dueDate) < new Date() && task.status !== "DONE" && "text-destructive")}>
                    {formatDate(task.dueDate) || "—"}
                  </span>
                </MetaItem>
                <MetaItem icon={<FolderKanban className="h-3.5 w-3.5 text-muted-foreground" />} label="Created">
                  <span className="text-sm">{formatDate(task.createdAt)}</span>
                </MetaItem>
              </div>

              {/* Documents */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-sm font-medium">
                    <Paperclip className="h-3.5 w-3.5 text-muted-foreground" />
                    Documents ({task.documents.length})
                  </span>
                  <span className="text-[10px] text-muted-foreground">max {MAX_DOCS} · {formatBytes(MAX_DOC_SIZE)} each</span>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    uploadFiles(e.target.files);
                    e.target.value = "";
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full h-8 text-xs border-dashed gap-1.5 font-normal text-muted-foreground"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading || task.documents.length >= MAX_DOCS}
                >
                  {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                  Attach documents
                </Button>

                {task.documents.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-2">No documents attached.</p>
                ) : (
                  <ul className="space-y-1">
                    {task.documents.map((doc) => (
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
                          className="h-6 w-6 shrink-0"
                          title="Download"
                          onClick={() => window.open(`/api/task-documents/${doc.id}?download=1`, "_blank")}
                        >
                          <Download className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 shrink-0 text-destructive hover:text-destructive"
                          title="Remove"
                          onClick={() => deleteDoc(doc.id)}
                          disabled={deletingId === doc.id}
                        >
                          {deletingId === doc.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                        </Button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Comments */}
              {task.comments.length > 0 && (
                <>
                  <Separator />
                  <div className="space-y-2.5">
                    <span className="flex items-center gap-1.5 text-sm font-medium">
                      <MessageSquare className="h-3.5 w-3.5 text-muted-foreground" />
                      Comments ({task.comments.length})
                    </span>
                    {task.comments.map((c) => (
                      <div key={c.id} className="flex gap-2.5">
                        <Avatar className="h-6 w-6 shrink-0 mt-0.5">
                          <AvatarImage src={c.author.image ?? ""} />
                          <AvatarFallback className="text-[8px]">{getInitials(c.author.name)}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 rounded-lg bg-muted/30 px-3 py-2">
                          <div className="flex items-baseline justify-between gap-3">
                            <span className="text-xs font-medium">{c.author.name}</span>
                            <span className="text-[10px] text-muted-foreground">{formatDate(c.createdAt)}</span>
                          </div>
                          <p className="text-xs mt-0.5 whitespace-pre-wrap">{c.content}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </ScrollArea>
        )}

        <DocumentPreview
          open={!!preview}
          onOpenChange={(o) => !o && setPreview(null)}
          document={preview?.doc ?? null}
          src={preview?.src ?? null}
        />
      </DialogContent>
    </Dialog>
  );
}

function MetaItem({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 rounded-md border border-border px-2.5 py-2 bg-card">
      <span className="shrink-0">{icon}</span>
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
        <div className="truncate">{children}</div>
      </div>
    </div>
  );
}
