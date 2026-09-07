"use client";

import { ChevronsUpDown, Zap } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const workspaces = [
  { name: "Synchro", plan: "Pro" },
];

export function WorkspaceSwitcher({ sidebarMode }: { sidebarMode?: boolean }) {
  const current = workspaces[0];

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
              {current.name}
            </p>
            <p
              className="text-[11px] mt-0.5"
              style={sidebarMode ? { color: "hsl(var(--sidebar-fg-muted))" } : { color: "hsl(var(--muted-foreground))" }}
            >
              {current.plan}
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
          <DropdownMenuItem key={ws.name} className="gap-2">
            <div className="flex h-5 w-5 items-center justify-center rounded bg-primary/10">
              <Zap className="h-3 w-3 text-primary" />
            </div>
            <span className="text-sm">{ws.name}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
