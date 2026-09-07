"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  FolderKanban,
  CheckSquare,
  Calendar,
  Users,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  Zap,
  Plus,
  UserCog,
  Flag,
  DollarSign,
  FileText,
  ShieldAlert,
  AlertCircle,
  Cpu,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { UserNav } from "@/components/layout/user-nav";
import { WorkspaceSwitcher } from "@/components/layout/workspace-switcher";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { useTranslations } from "next-intl";
import { useSession } from "next-auth/react";

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const t = useTranslations("nav");
  const { data: session } = useSession();
  const isAdmin = (session?.user as { role?: string })?.role === "ADMIN";

// prefetch semua nav links saat sidebar mount
const navItems = [
    { href: "/dashboard",  label: t("overview"),    icon: LayoutDashboard },
    { href: "/projects",   label: t("projects"),    icon: FolderKanban },
    { href: "/tasks",      label: t("myTasks"),     icon: CheckSquare },
    { href: "/milestones", label: t("milestones"),  icon: Flag },
    { href: "/calendar",   label: t("calendar"),    icon: Calendar },
    { href: "/team",       label: t("team"),        icon: Users },
    { href: "/finance",    label: t("finance"),     icon: DollarSign },
    { href: "/invoices",   label: t("invoices"),    icon: FileText },
    { href: "/risks",      label: t("risks"),       icon: ShieldAlert },
    { href: "/issues",     label: t("issues"),      icon: AlertCircle },
    { href: "/resources",  label: t("resources"),   icon: Cpu },
    { href: "/reports",    label: t("reports"),     icon: BarChart3 },
  ];

  const bottomItems = [
    { href: "/settings", label: t("settings"), icon: Settings },
    ...(isAdmin ? [{ href: "/settings/users", label: t("userManagement"), icon: UserCog }] : []),
  ];

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        style={{ background: "hsl(var(--sidebar-bg))" }}
        className={cn(
          "relative flex h-screen flex-col transition-all duration-300 ease-in-out shrink-0",
          "border-r",
          collapsed ? "w-[60px]" : "w-[220px]"
        )}
      >
        {/* Right border accent line for extra visual separation */}
        <div
          className="absolute inset-y-0 right-0 w-px opacity-40"
          style={{ background: "hsl(var(--sidebar-border))" }}
        />

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          style={{
            background: "hsl(var(--sidebar-hover-bg))",
            color: "hsl(var(--sidebar-fg))",
            borderColor: "hsl(var(--sidebar-border))",
          }}
          className="absolute -right-3 top-6 z-10 flex h-6 w-6 items-center justify-center rounded-full border shadow-md transition-colors hover:opacity-90"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <ChevronRight className="h-3 w-3" />
          ) : (
            <ChevronLeft className="h-3 w-3" />
          )}
        </button>

        {/* Logo / Workspace */}
        <div
          style={{ borderBottomColor: "hsl(var(--sidebar-border))" }}
          className={cn(
            "flex items-center border-b",
            collapsed ? "px-3 py-4 justify-center" : "px-4 py-4"
          )}
        >
          {collapsed ? (
            <div
              style={{ background: "hsl(var(--sidebar-active-bg) / 0.2)" }}
              className="flex h-8 w-8 items-center justify-center rounded-lg"
            >
              <Zap className="h-4 w-4" style={{ color: "hsl(var(--sidebar-active-bg))" }} />
            </div>
          ) : (
            <WorkspaceSwitcher sidebarMode />
          )}
        </div>

        {/* Nav */}
        <ScrollArea className="flex-1 py-2">
          {/* Section label */}
          {!collapsed && (
            <p
              style={{ color: "hsl(var(--sidebar-fg-muted))" }}
              className="px-5 pt-2 pb-1.5 text-[10px] font-semibold uppercase tracking-widest"
            >
              Menu
            </p>
          )}
          <nav className={cn("flex flex-col gap-0.5", collapsed ? "px-2" : "px-3")}>
            {navItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
              const Icon = item.icon;

              if (collapsed) {
                return (
                  <Tooltip key={item.href}>
                    <TooltipTrigger asChild>
                      <Link
                        href={item.href}
                        style={
                          isActive
                            ? { background: "hsl(var(--sidebar-active-bg))", color: "hsl(var(--sidebar-active-fg))" }
                            : { color: "hsl(var(--sidebar-fg-muted))" }
                        }
                        className={cn(
                          "flex h-9 w-9 items-center justify-center rounded-lg transition-all",
                          !isActive && "hover:bg-white/10 hover:text-white"
                        )}
                      >
                        <Icon className="h-4 w-4" />
                      </Link>
                    </TooltipTrigger>
                    <TooltipContent side="right" className="font-medium">
                      {item.label}
                    </TooltipContent>
                  </Tooltip>
                );
              }

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  style={
                    isActive
                      ? { background: "hsl(var(--sidebar-active-bg))", color: "hsl(var(--sidebar-active-fg))" }
                      : { color: "hsl(var(--sidebar-fg))" }
                  }
                  className={cn(
                    "flex h-9 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-all",
                    !isActive && "hover:bg-white/10 hover:brightness-125"
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="truncate">{item.label}</span>
                  {isActive && (
                    <span
                      className="ml-auto h-1.5 w-1.5 rounded-full"
                      style={{ background: "hsl(var(--sidebar-active-fg))" }}
                    />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Quick actions */}
          {!collapsed && (
            <div className="mt-5 px-3">
              <p
                style={{ color: "hsl(var(--sidebar-fg-muted))" }}
                className="px-2 pb-1.5 text-[10px] font-semibold uppercase tracking-widest"
              >
                {t("quickActions")}
              </p>
              <button
                className="flex h-8 w-full items-center gap-2 rounded-lg px-3 text-xs font-medium transition-all hover:bg-white/10"
                style={{ color: "hsl(var(--sidebar-fg-muted))", borderColor: "hsl(var(--sidebar-border))" }}
                onClick={() => (window.location.href = "/projects/new")}
              >
                <Plus className="h-3.5 w-3.5 shrink-0" />
                <span>{t("newProject")}</span>
              </button>
            </div>
          )}
        </ScrollArea>

        {/* Bottom section */}
        <div
          style={{ borderTopColor: "hsl(var(--sidebar-border))" }}
          className={cn("border-t py-2", collapsed ? "px-2" : "px-3")}
        >
          {bottomItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            const Icon = item.icon;

            if (collapsed) {
              return (
                <Tooltip key={item.href}>
                  <TooltipTrigger asChild>
                    <Link
                      href={item.href}
                      style={
                        isActive
                          ? { background: "hsl(var(--sidebar-active-bg))", color: "hsl(var(--sidebar-active-fg))" }
                          : { color: "hsl(var(--sidebar-fg-muted))" }
                      }
                      className={cn(
                        "mb-0.5 flex h-9 w-9 items-center justify-center rounded-lg transition-all",
                        !isActive && "hover:bg-white/10 hover:text-white"
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="right">{item.label}</TooltipContent>
                </Tooltip>
              );
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                style={
                  isActive
                    ? { background: "hsl(var(--sidebar-active-bg))", color: "hsl(var(--sidebar-active-fg))" }
                    : { color: "hsl(var(--sidebar-fg))" }
                }
                className={cn(
                  "mb-0.5 flex h-9 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-all",
                  !isActive && "hover:bg-white/10 hover:brightness-125"
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}

          {/* Language & user nav — recolored for dark sidebar */}
          <div
            style={{ borderTopColor: "hsl(var(--sidebar-border))" }}
            className="mt-1 pt-2 border-t space-y-0.5"
          >
            <LanguageSwitcher collapsed={collapsed} sidebarMode />
            <UserNav collapsed={collapsed} sidebarMode />
          </div>
        </div>
      </aside>
    </TooltipProvider>
  );
}
