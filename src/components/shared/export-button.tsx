"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { exportTasksData, exportProjectsData, exportUsersData } from "@/actions/export";
import { toast } from "sonner";

type ExportType = "tasks" | "projects" | "users";

interface ExportButtonProps {
  type: ExportType;
  filters?: {
    status?: string;
    priority?: string;
    projectId?: string;
    search?: string;
  };
  size?: "sm" | "default";
}

function downloadBase64(base64: string, filename: string) {
  const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
  const blob = new Blob([bytes], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function ExportButton({ type, filters, size = "sm" }: ExportButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    setLoading(true);
    try {
      let result: { data: string; filename: string; count: number };
      if (type === "tasks") {
        result = await exportTasksData(filters);
      } else if (type === "projects") {
        result = await exportProjectsData();
      } else {
        result = await exportUsersData();
      }
      downloadBase64(result.data, result.filename);
      toast.success(`Exported ${result.count} records`);
    } catch (err) {
      toast.error("Export failed: " + String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant="outline"
      size={size}
      className="h-8 gap-1.5 text-xs"
      onClick={handleExport}
      disabled={loading}
    >
      {loading ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <Download className="h-3.5 w-3.5" />
      )}
      {loading ? "Exporting..." : "Export XLSX"}
    </Button>
  );
}
