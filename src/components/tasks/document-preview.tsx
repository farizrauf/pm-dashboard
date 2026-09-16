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

/* ── Lightweight OOXML (docx/xlsx/pptx) text extraction ─────────────────────
   These files are ZIP archives of XML parts. We unzip in the browser with
   JSZip (dynamic import), pull the text nodes out, and render them as a
   simple table/paragraph view — visible without downloading.               */

type Match = RegExpMatchArray;

async function extractOoxml(blob: Blob, name: string): Promise<string> {
  const JSZip = (await import("jszip")).default;
  const zip = await JSZip.loadAsync(blob);
  const read = async (path: string): Promise<string | null> => {
    const f = zip.file(path);
    return f ? f.async("text") : null;
  };
  const decode = (s: string): string =>
    s
      .replace(/<[^>]+>/g, " ")
      .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&")
      .replace(/&quot;/g, '"').replace(/&apos;/g, "'")
      .replace(/[ \t]+/g, " ");

  if (/\.docx$/i.test(name)) {
    const xml = await read("word/document.xml");
    if (!xml) return "";
    return xml
      .split("</w:p>")
      .map((p: string) =>
        Array.from(p.matchAll(/<w:t[^>]*>([\s\S]*?)<\/w:t>/g) as Iterable<Match>).map((m: Match) => decode(m[1])).join("")
      )
      .filter((line: string) => line.trim() !== "")
      .join("\n");
  }

  if (/\.xlsx$/i.test(name)) {
    const sharedXml = await read("xl/sharedStrings.xml");
    const shared: string[] = sharedXml
      ? Array.from(sharedXml.matchAll(/<si[^>]*>([\s\S]*?)<\/si>/g) as Iterable<Match>).map(
          (m: Match) =>
            Array.from(m[1].matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g) as Iterable<Match>).map((t: Match) => decode(t[1])).join("")
        )
      : [];
    const sheetNames = Object.keys(zip.files).filter((p: string) => /^xl\/worksheets\/sheet\d+\.xml$/.test(p));
    const out: string[] = [];
    for (const sheetName of sheetNames.sort()) {
      const xml = await read(sheetName);
      if (!xml) continue;
      out.push(`── ${sheetName.replace(/^xl\/worksheets\//, "").replace(".xml", "")} ──`);
      for (const row of Array.from(xml.matchAll(/<row[^>]*>([\s\S]*?)<\/row>/g) as Iterable<Match>)) {
        const cells = Array.from(row[1].matchAll(/<c[^>]*?(?: t="(\w+)")?[^>]*>([\s\S]*?)<\/c>/g) as Iterable<Match>).map((c: Match) => {
          const v = c[2].match(/<v[^>]*>([\s\S]*?)<\/v>/)?.[1] ?? c[2].match(/<t[^>]*>([\s\S]*?)<\/t>/)?.[1] ?? "";
          return c[1] === "s" ? shared[parseInt(v, 10)] ?? v : decode(v);
        });
        if (cells.some((x: string) => x.trim())) out.push(cells.join(" | "));
      }
    }
    return out.join("\n");
  }

  if (/\.pptx$/i.test(name)) {
    const slides = Object.keys(zip.files)
      .filter((p: string) => /^ppt\/slides\/slide\d+\.xml$/.test(p))
      .sort((a: string, b: string) => parseInt(a.match(/\d+/)![0]) - parseInt(b.match(/\d+/)![0]));
    const out: string[] = [];
    for (let i = 0; i < slides.length; i++) {
      const xml = await read(slides[i]);
      if (!xml) continue;
      const texts = Array.from(xml.matchAll(/<a:t[^>]*>([\s\S]*?)<\/a:t>/g) as Iterable<Match>).map((m: Match) => decode(m[1])).filter(Boolean);
      out.push(`── Slide ${i + 1} ──\n${texts.join("\n")}`);
    }
    return out.join("\n\n");
  }

  return "";
}

interface DocumentPreviewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  document: DocumentMeta | null;
  /** URL that serves the bytes — API route for saved docs, object URL for pending uploads. */
  src: string | null;
}

type PreviewKind = "image" | "pdf" | "text" | "office" | "none";

function previewKind(mimeType: string, name: string): PreviewKind {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType === "application/pdf") return "pdf";
  if (
    mimeType.startsWith("text/") ||
    mimeType === "application/json" ||
    /\.(md|txt|csv|json|log)$/i.test(mimeType)
  )
    return "text";
  // Only the ZIP-based OOXML formats are previewable; legacy binaries are not.
  if (/\.(docx|xlsx|pptx)$/i.test(name) ||
      mimeType.startsWith("application/vnd.openxmlformats-officedocument"))
    return "office";
  return "none";
}

export function DocumentPreview({ open, onOpenChange, document: doc, src }: DocumentPreviewProps) {
  const [text, setText] = useState<string | null>(null);
  const [officeText, setOfficeText] = useState<string | null>(null);
  const [textLoading, setTextLoading] = useState(false);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);

  const kind = doc ? previewKind(doc.mimeType, doc.name) : "none";

  // Text preview via fetch → string
  useEffect(() => {
    if (!open || !doc || !src || kind !== "text") {
      setText(null);
      return;
    }
    let cancelled = false;
    setTextLoading(true);
    fetch(src)
      .then((r) => r.text())
      .then((t) => {
        if (!cancelled) setText(t.length > 200_000 ? t.slice(0, 200_000) + "\n…(truncated)" : t);
      })
      .catch(() => { if (!cancelled) setText(null); })
      .finally(() => { if (!cancelled) setTextLoading(false); });
    return () => { cancelled = true; };
  }, [open, doc, src, kind]);

  // Blob URL for images + PDFs so the browser renders them inline. The API
  // route sends Content-Disposition: attachment, which would otherwise force
  // a download inside the iframe/img.
  useEffect(() => {
    if (!open || !src || (kind !== "image" && kind !== "pdf")) {
      setBlobUrl(null);
      return;
    }
    let cancelled = false;
    let url: string | null = null;
    fetch(src)
      .then((r) => r.ok ? r.blob() : Promise.reject())
      .then((b) => {
        if (cancelled) return;
        url = window.URL.createObjectURL(b);
        setBlobUrl(url);
      })
      .catch(() => { if (!cancelled) setBlobUrl(null); });
    return () => {
      cancelled = true;
      if (url) window.URL.revokeObjectURL(url);
    };
  }, [open, src, kind]);

  // OOXML (docx/xlsx/pptx): unzip in-browser and render the text content.
  useEffect(() => {
    if (!open || !src || kind !== "office") {
      setOfficeText(null);
      return;
    }
    let cancelled = false;
    setTextLoading(true);
    fetch(src)
      .then((r) => (r.ok ? r.blob() : Promise.reject()))
      .then(async (b) => {
        const t = await extractOoxml(b, doc?.name ?? "");
        if (!cancelled) setOfficeText(t.length > 200_000 ? t.slice(0, 200_000) + "\n…(truncated)" : t);
      })
      .catch(() => { if (!cancelled) setOfficeText(null); })
      .finally(() => { if (!cancelled) setTextLoading(false); });
    return () => { cancelled = true; };
  }, [open, src, kind, doc?.name]);

  if (!doc) return null;

  const viewSrc = blobUrl ?? src;
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
          {kind === "image" && viewSrc && (
            <div className="flex items-center justify-center p-4 max-h-[65vh] overflow-auto">
              <img src={viewSrc} alt={doc.name} className="max-h-[60vh] max-w-full object-contain rounded-md" />
            </div>
          )}
          {kind === "pdf" &&
            (viewSrc ? (
              <iframe src={viewSrc} title={doc.name} className="w-full h-[65vh] bg-white" />
            ) : (
              <div className="flex items-center justify-center h-32 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
            ))}
          {kind === "text" && (
            <div className="max-h-[60vh] overflow-auto p-4">
              {textLoading ? (
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
          {kind === "office" && (
            <div className="max-h-[60vh] overflow-auto p-4">
              {textLoading ? (
                <div className="flex items-center justify-center h-32 text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin" />
                </div>
              ) : officeText ? (
                <pre className="text-xs font-mono whitespace-pre-wrap break-words">{officeText}</pre>
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
