"use client";

import { ChevronsUpDown, Trash2, Zap } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type Workspace = { id: string; name: string; slug: string; plan: string; role: string };

export function WorkspaceSwitcher({ sidebarMode }: { sidebarMode?: boolean }) {
  const t = useTranslations("workspace");
  const router = useRouter();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/workspaces", { cache: "no-store" })
      .then((response) => response.ok ? response.json() : null)
      .then((data: { workspaces: Workspace[]; activeId: string | null } | null) => {
        if (!data) return;
        setWorkspaces(data.workspaces);
        setActiveId(data.activeId);
      })
      .catch(() => undefined);
  }, []);

  const current = workspaces.find((workspace) => workspace.id === activeId) ?? workspaces[0];

  const switchWorkspace = async (workspace: Workspace) => {
    setActiveId(workspace.id);
    await fetch("/api/workspaces", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ workspaceId: workspace.id }),
    });
    router.refresh();
  };

  const createWorkspace = async () => {
    const name = window.prompt("Workspace name");
    if (!name?.trim()) return;
    const response = await fetch("/api/workspaces", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    if (!response.ok) return;
    const data = await response.json() as { workspace: Workspace };
    setWorkspaces((currentWorkspaces) => [...currentWorkspaces, data.workspace]);
    setActiveId(data.workspace.id);
    router.refresh();
  };

  const deleteWorkspace = async () => {
    if (!current || !["OWNER", "ADMIN"].includes(current.role)) return;
    if (!window.confirm(t("deleteConfirm", { name: current.name }))) return;
    const response = await fetch("/api/workspaces", { method: "DELETE" });
    if (!response.ok) {
      const data = await response.json().catch(() => null) as { error?: string } | null;
      window.alert(data?.error ?? t("deleteFailed"));
      return;
    }
    const data = await response.json() as { activeId: string | null };
    setWorkspaces((items) => items.filter((workspace) => workspace.id !== current.id));
    setActiveId(data.activeId);
    router.refresh();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="flex w-full items-center gap-2.5 rounded-lg px-0 py-1 text-left transition-all outline-none hover:bg-white/10"
        >
          <div
            className="flex h-8 w-8 items-center justify-center rounded-lg shrink-0"
            style={
              sidebarMode
                ? { background: "hsl(var(--sidebar-active-bg) / 0.25)" }
                : { background: "hsl(var(--primary) / 0.1)" }
            }
          >
            <Zap
              className="h-4 w-4"
              style={
                sidebarMode
                  ? { color: "hsl(var(--sidebar-active-bg))" }
                  : { color: "hsl(var(--primary))" }
              }
            />
          </div>
          <div className="flex-1 min-w-0">
            <p
              className="text-sm font-bold truncate leading-none"
              style={sidebarMode ? { color: "hsl(var(--sidebar-fg))" } : undefined}
            >
              {current?.name ?? "Workspace"}
            </p>
            <p
              className="text-[11px] mt-0.5"
              style={sidebarMode ? { color: "hsl(var(--sidebar-fg-muted))" } : { color: "hsl(var(--muted-foreground))" }}
            >
              {current?.plan ?? "Free"}
            </p>
          </div>
          <ChevronsUpDown
            className="h-3.5 w-3.5 shrink-0"
            style={sidebarMode ? { color: "hsl(var(--sidebar-fg-muted))" } : { color: "hsl(var(--muted-foreground))" }}
          />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuLabel className="text-xs">Workspaces</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {workspaces.map((ws) => (
          <DropdownMenuItem key={ws.id} className="gap-2" onClick={() => switchWorkspace(ws)}>
            <div className="flex h-5 w-5 items-center justify-center rounded bg-primary/10">
              <Zap className="h-3 w-3 text-primary" />
            </div>
            <span className="text-sm">{ws.name}</span>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem className="gap-2" onClick={createWorkspace}>
          <span className="flex h-5 w-5 items-center justify-center rounded bg-primary/10 text-primary">+</span>
            <span className="text-sm">{t("create")}</span>
        </DropdownMenuItem>
        {current && ["OWNER", "ADMIN"].includes(current.role) && (
          <DropdownMenuItem className="gap-2 text-destructive focus:text-destructive" onClick={deleteWorkspace}>
            <Trash2 className="h-3.5 w-3.5" />
            <span className="text-sm">{t("delete")}</span>
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
