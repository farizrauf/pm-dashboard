"use client";

import { useState, useRef, useCallback } from "react";
import { Upload, FileSpreadsheet, X, AlertCircle, CheckCircle2, Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { importTasksData, getTaskImportTemplate, getUserImportTemplate } from "@/actions/export";
import type { ImportTaskRow } from "@/actions/export";
import { importUsers } from "@/actions/admin";
import type { ImportUserRow } from "@/actions/admin";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { cn } from "@/lib/utils";

interface ImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: "tasks" | "users";
  projects?: { id: string; name: string; color: string }[];
  onSuccess?: () => void;
}

type ImportResult = {
  row: number;
  status: "ok" | "error";
  message?: string;
};

export function ImportDialog({
  open,
  onOpenChange,
  type,
  onSuccess,
}: ImportDialogProps) {
  const [dragging, setDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<Record<string, string>[]>([]);
  const [importing, setImporting] = useState(false);
  const [results, setResults] = useState<ImportResult[] | null>(null);
  const [downloadingTemplate, setDownloadingTemplate] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setFile(null);
    setPreview([]);
    setResults(null);
  };

  const parseFile = useCallback(async (f: File) => {
    const arrayBuffer = await f.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: "array" });
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json<Record<string, string>>(firstSheet, {
      defval: "",
    });
    setFile(f);
    setPreview(rows.slice(0, 5)); // show first 5 rows as preview
    setResults(null);
    return rows;
  }, []);

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const dropped = e.dataTransfer.files[0];
      if (dropped) await parseFile(dropped);
    },
    [parseFile]
  );

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const selected = e.target.files?.[0];
      if (selected) await parseFile(selected);
    },
    [parseFile]
  );

  const handleImport = async () => {
    if (!file) return;
    setImporting(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: "array" });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<Record<string, string>>(firstSheet, {
        defval: "",
      });

      let result: { successCount: number; errorCount: number; results: ImportResult[] };

      if (type === "tasks") {
        const taskRows: ImportTaskRow[] = rows.map((r) => ({
          title: String(r.title ?? r.Title ?? ""),
          description: String(r.description ?? r.Description ?? ""),
          status: String(r.status ?? r.Status ?? ""),
          priority: String(r.priority ?? r.Priority ?? ""),
          dueDate: String(r.dueDate ?? r["Due Date"] ?? ""),
          assigneeEmail: String(r.assigneeEmail ?? r["Assignee Email"] ?? ""),
          projectName: String(r.projectName ?? r.Project ?? ""),
        }));
        result = await importTasksData(taskRows);
      } else {
        const userRows: ImportUserRow[] = rows.map((r) => ({
          name: String(r.name ?? r.Name ?? ""),
          email: String(r.email ?? r.Email ?? ""),
          password: String(r.password ?? r.Password ?? ""),
          role: String(r.role ?? r.Role ?? "MEMBER"),
        }));
        result = await importUsers(userRows);
      }

      setResults(result.results);

      if (result.successCount > 0) {
        toast.success(`Successfully imported ${result.successCount} record(s)`);
      }
      if (result.errorCount > 0) {
        toast.error(`${result.errorCount} row(s) had errors`);
      }
      if (result.errorCount === 0) {
        onSuccess?.();
      }
    } catch (err) {
      toast.error("Import failed: " + String(err));
    } finally {
      setImporting(false);
    }
  };

  const handleDownloadTemplate = async () => {
    setDownloadingTemplate(true);
    try {
      const base64 =
        type === "tasks"
          ? await getTaskImportTemplate()
          : await getUserImportTemplate();
      const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
      const blob = new Blob([bytes], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${type}-import-template.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Failed to download template");
    } finally {
      setDownloadingTemplate(false);
    }
  };

  const previewColumns = preview.length > 0 ? Object.keys(preview[0]) : [];

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); onOpenChange(v); }}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            Import {type === "tasks" ? "Tasks" : "Users"}
          </DialogTitle>
          <DialogDescription>
            Upload an Excel (.xlsx) or CSV file. Download the template to see the required format.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Template download */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/40 border border-border">
            <div>
              <p className="text-sm font-medium">Download Template</p>
              <p className="text-xs text-muted-foreground">
                Required columns:{" "}
                {type === "tasks"
                  ? "title, status, priority, dueDate, assigneeEmail, projectName"
                  : "name, email, password, role"}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={handleDownloadTemplate}
              disabled={downloadingTemplate}
            >
              {downloadingTemplate ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Download className="h-3.5 w-3.5" />
              )}
              Template
            </Button>
          </div>

          {/* Drop zone */}
          {!file && (
            <div
              className={cn(
                "relative flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-10 transition-colors cursor-pointer",
                dragging
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50 hover:bg-muted/30"
              )}
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              onClick={() => inputRef.current?.click()}
            >
              <FileSpreadsheet className="h-10 w-10 text-muted-foreground" />
              <div className="text-center">
                <p className="text-sm font-medium">
                  Drop your Excel or CSV file here
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Supported: .xlsx, .xls, .csv
                </p>
              </div>
              <Button variant="outline" size="sm" className="gap-1.5" type="button">
                <Upload className="h-3.5 w-3.5" /> Browse File
              </Button>
              <input
                ref={inputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>
          )}

          {/* File selected + preview */}
          {file && !results && (
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/40 border border-border">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium truncate max-w-[300px]">{file.name}</span>
                  <Badge variant="secondary" className="text-xs">
                    {preview.length} rows preview
                  </Badge>
                </div>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={reset}>
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>

              {preview.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2">
                    Preview (first {preview.length} rows)
                  </p>
                  <ScrollArea className="h-40 rounded-lg border border-border">
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b border-border bg-muted/30">
                            {previewColumns.map((col) => (
                              <th key={col} className="px-3 py-2 text-left font-medium text-muted-foreground whitespace-nowrap">
                                {col}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {preview.map((row, i) => (
                            <tr key={i} className="border-b border-border last:border-0">
                              {previewColumns.map((col) => (
                                <td key={col} className="px-3 py-2 text-muted-foreground truncate max-w-[120px]">
                                  {String(row[col] ?? "")}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </ScrollArea>
                </div>
              )}
            </div>
          )}

          {/* Import results */}
          {results && (
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <Badge variant="secondary" className="gap-1">
                  <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                  {results.filter((r) => r.status === "ok").length} success
                </Badge>
                {results.some((r) => r.status === "error") && (
                  <Badge variant="destructive" className="gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {results.filter((r) => r.status === "error").length} errors
                  </Badge>
                )}
              </div>
              {results.some((r) => r.status === "error") && (
                <ScrollArea className="h-32 rounded-lg border border-border p-2">
                  {results
                    .filter((r) => r.status === "error")
                    .map((r) => (
                      <div key={r.row} className="flex gap-2 py-1 text-xs">
                        <span className="font-medium text-muted-foreground shrink-0">Row {r.row}:</span>
                        <span className="text-destructive">{r.message}</span>
                      </div>
                    ))}
                </ScrollArea>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => { reset(); onOpenChange(false); }}>
            {results ? "Close" : "Cancel"}
          </Button>
          {file && !results && (
            <Button onClick={handleImport} disabled={importing} className="gap-1.5">
              {importing ? (
                <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Importing...</>
              ) : (
                <><Upload className="h-3.5 w-3.5" /> Import {preview.length} rows</>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
