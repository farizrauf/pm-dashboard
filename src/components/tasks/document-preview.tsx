"use client";

import { useEffect, useState } from "react";
import { Download, FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatBytes } from "@/lib/utils";

export type DocumentMeta = {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  createdAt?: Date | string;
};

interface DocumentPreviewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  document: DocumentMeta | null;
  /** URL that serves the bytes — API route for saved docs, object URL for pending uploads. */
  src: string | null;
}

type PreviewKind = "image" | "pdf" | "text" | "none";

function previewKind(mimeType: string): PreviewKind {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType === "application/pdf") return "pdf";
  if (
    mimeType.startsWith("text/") ||
    mimeType === "application/json" ||
    /\.(md|txt|csv|json|log)$/i.test(mimeType)
  )
    return "text";
  return "none";
}

export function DocumentPreview({ open, onOpenChange, document: doc, src }: DocumentPreviewProps) {
  const [text, setText] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const kind = doc ? previewKind(doc.mimeType) : "none";

  useEffect(() => {
    if (!open || !doc || !src || kind !== "text") {
      setText(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    fetch(src)
      .then((r) => r.text())
      .then((t) => {
        if (!cancelled) setText(t.length > 200_000 ? t.slice(0, 200_000) + "\n…(truncated)" : t);
      })
      .catch(() => {
        if (!cancelled) setText(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, doc, src, kind]);

  if (!doc) return null;
  const downloadHref = src && src.startsWith("/") ? `${src}?download=1` : src;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="truncate">{doc.name}</span>
          </DialogTitle>
          <p className="text-xs text-muted-foreground">
            {doc.mimeType || "unknown"} · {formatBytes(doc.size)}
            {doc.createdAt
              ? ` · uploaded ${new Date(doc.createdAt).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })}`
              : ""}
          </p>
        </DialogHeader>

        <div className="rounded-lg border border-border bg-muted/20 overflow-hidden">
          {kind === "image" && src && (
            <div className="flex items-center justify-center p-4 max-h-[65vh] overflow-auto">
              <img src={src} alt={doc.name} className="max-h-[60vh] max-w-full object-contain rounded-md" />
            </div>
          )}
          {kind === "pdf" && src && (
            <iframe src={src} title={doc.name} className="w-full h-[65vh] bg-white" />
          )}
          {kind === "text" && (
            <div className="max-h-[60vh] overflow-auto p-4">
              {loading ? (
                <div className="flex items-center justify-center h-32 text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin" />
                </div>
              ) : text !== null ? (
                <pre className="text-xs font-mono whitespace-pre-wrap break-words">{text}</pre>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">Could not load preview.</p>
              )}
            </div>
          )}
          {kind === "none" && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3">
                <FileText className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium">No preview available</p>
              <p className="text-xs text-muted-foreground mt-1">Download the file to view it.</p>
            </div>
          )}
        </div>

        {downloadHref && (
          <div className="flex justify-end">
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => window.open(downloadHref, "_blank")}>
              <Download className="h-3.5 w-3.5" /> Download
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
