"use client";

import { Bell, Moon, Sun, Search, X, CheckCircle2, Clock, AlertCircle, FolderKanban } from "lucide-react";
import { useTheme } from "next-themes";
import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface HeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}

// ── Mock notifications (in a real app these would come from the DB) ──────────
const MOCK_NOTIFICATIONS = [
  {
    id: "1",
    type: "task" as const,
    title: "Task deadline approaching",
    desc: "BRI — Implementasi SNAP BI is due tomorrow",
    time: "5m ago",
    read: false,
    href: "/tasks",
  },
  {
    id: "2",
    type: "project" as const,
    title: "Milestone completed",
    desc: "BCA — T24 Environment Setup signed off",
    time: "1h ago",
    read: false,
    href: "/milestones",
  },
  {
    id: "3",
    type: "alert" as const,
    title: "Invoice overdue",
    desc: "BCA Core Banking Q1 2026 payment overdue",
    time: "2h ago",
    read: false,
    href: "/invoices",
  },
  {
    id: "4",
    type: "task" as const,
    title: "New comment on task",
    desc: "Arif commented on: Implementasi SNAP BI",
    time: "3h ago",
    read: true,
    href: "/tasks",
  },
  {
    id: "5",
    type: "project" as const,
    title: "New risk reported",
    desc: "High-severity risk added to BCA project",
    time: "Yesterday",
    read: true,
    href: "/risks",
  },
];

// ── Global search nav items ───────────────────────────────────────────────────
const SEARCH_ITEMS = [
  { label: "Dashboard", href: "/dashboard", category: "Pages" },
  { label: "Projects", href: "/projects", category: "Pages" },
  { label: "My Tasks", href: "/tasks", category: "Pages" },
  { label: "Milestones", href: "/milestones", category: "Pages" },
  { label: "Calendar", href: "/calendar", category: "Pages" },
  { label: "Team", href: "/team", category: "Pages" },
  { label: "Finance", href: "/finance", category: "Pages" },
  { label: "Invoices", href: "/invoices", category: "Pages" },
  { label: "Risks", href: "/risks", category: "Pages" },
  { label: "Issues", href: "/issues", category: "Pages" },
  { label: "Resources", href: "/resources", category: "Pages" },
  { label: "Reports", href: "/reports", category: "Pages" },
  { label: "Settings", href: "/settings", category: "Pages" },
  { label: "User Management", href: "/settings/users", category: "Settings" },
];

// ── Notification icon by type ─────────────────────────────────────────────────
function NotifIcon({ type }: { type: "task" | "project" | "alert" }) {
  if (type === "task") return <CheckCircle2 className="h-4 w-4 text-primary" />;
  if (type === "project") return <FolderKanban className="h-4 w-4 text-emerald-500" />;
  return <AlertCircle className="h-4 w-4 text-amber-500" />;
}

export function Header({ title, description, actions }: HeaderProps) {
  const { theme, setTheme } = useTheme();
  const router = useRouter();

  // ── Search state ─────────────────────────────────────────────────────────────
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIdx, setSelectedIdx] = useState(0);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const filteredItems = searchQuery.trim()
    ? SEARCH_ITEMS.filter((item) =>
        item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : SEARCH_ITEMS;

  const openSearch = useCallback(() => {
    setSearchOpen(true);
    setSearchQuery("");
    setSelectedIdx(0);
  }, []);

  const closeSearch = useCallback(() => {
    setSearchOpen(false);
    setSearchQuery("");
  }, []);

  const navigateTo = useCallback((href: string) => {
    closeSearch();
    router.push(href);
  }, [closeSearch, router]);

  // Keyboard shortcut Cmd/Ctrl + K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        searchOpen ? closeSearch() : openSearch();
      }
      if (e.key === "Escape" && searchOpen) closeSearch();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [searchOpen, openSearch, closeSearch]);

  // Focus input when modal opens
  useEffect(() => {
    if (searchOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
  }, [searchOpen]);

  // Arrow key navigation in search results
  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIdx((i) => Math.min(i + 1, filteredItems.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && filteredItems[selectedIdx]) {
      navigateTo(filteredItems[selectedIdx].href);
    }
  };

  // ── Notification state ────────────────────────────────────────────────────────
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);
  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllRead = () => setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  const markRead = (id: string) => setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));

  return (
    <TooltipProvider>
      <header className="flex h-14 items-center justify-between border-b border-border bg-card/50 px-6 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex flex-col justify-center">
          <h1 className="text-base font-semibold leading-none">{title}</h1>
          {description && (
            <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
          )}
        </div>

        <div className="flex items-center gap-2">
          {actions}

          {/* Search trigger button */}
          <button
            onClick={openSearch}
            className="hidden md:flex items-center gap-1.5 h-8 rounded-md border border-input bg-background px-2.5 text-xs text-muted-foreground w-44 hover:border-primary/50 transition-colors"
          >
            <Search className="h-3.5 w-3.5 shrink-0" />
            <span>Search...</span>
            <kbd className="ml-auto text-[10px] font-mono bg-muted rounded px-1">⌘K</kbd>
          </button>

          {/* Mobile search icon */}
          <Button variant="ghost" size="icon" className="md:hidden h-8 w-8" onClick={openSearch}>
            <Search className="h-4 w-4" />
          </Button>

          {/* Notifications dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 relative">
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-destructive text-[9px] font-bold text-white flex items-center justify-center">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 p-0">
              <div className="flex items-center justify-between px-3 py-2.5 border-b border-border">
                <DropdownMenuLabel className="p-0 text-sm font-semibold">
                  Notifications
                  {unreadCount > 0 && (
                    <Badge variant="destructive" className="ml-2 text-[10px] px-1.5 py-0 h-4">
                      {unreadCount} new
                    </Badge>
                  )}
                </DropdownMenuLabel>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="text-[11px] text-primary hover:underline font-medium"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <Bell className="h-8 w-8 text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">No notifications</p>
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <button
                      key={notif.id}
                      className={cn(
                        "w-full flex items-start gap-2.5 px-3 py-2.5 hover:bg-accent/50 transition-colors text-left border-b border-border last:border-0",
                        !notif.read && "bg-primary/5"
                      )}
                      onClick={() => {
                        markRead(notif.id);
                        router.push(notif.href);
                      }}
                    >
                      <div className="shrink-0 mt-0.5 h-7 w-7 rounded-full bg-muted flex items-center justify-center">
                        <NotifIcon type={notif.type} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={cn("text-xs truncate", !notif.read ? "font-semibold text-foreground" : "text-foreground/80")}>
                          {notif.title}
                        </p>
                        <p className="text-[11px] text-muted-foreground truncate mt-0.5">{notif.desc}</p>
                        <div className="flex items-center gap-1 mt-1">
                          <Clock className="h-2.5 w-2.5 text-muted-foreground" />
                          <span className="text-[10px] text-muted-foreground">{notif.time}</span>
                          {!notif.read && (
                            <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" />
                          )}
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>

              <DropdownMenuSeparator />
              <div className="p-2">
                <button
                  onClick={() => router.push("/settings")}
                  className="w-full text-center text-xs text-primary hover:underline py-1"
                >
                  Manage notification preferences →
                </button>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Theme toggle */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              >
                <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Toggle theme</TooltipContent>
          </Tooltip>
        </div>
      </header>

      {/* ── Search Modal ──────────────────────────────────────────────────────── */}
      {searchOpen && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4"
          onClick={closeSearch}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" />

          {/* Modal */}
          <div
            className="relative w-full max-w-lg bg-card border border-border rounded-xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Search input */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
              <Search className="h-4 w-4 text-muted-foreground shrink-0" />
              <input
                ref={searchInputRef}
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setSelectedIdx(0); }}
                onKeyDown={handleSearchKeyDown}
                placeholder="Search pages, settings..."
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery("")} className="text-muted-foreground hover:text-foreground transition-colors">
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
              <kbd className="text-[10px] font-mono bg-muted rounded px-1.5 py-0.5 text-muted-foreground border border-border">
                ESC
              </kbd>
            </div>

            {/* Results */}
            <div className="max-h-80 overflow-y-auto py-1.5">
              {filteredItems.length === 0 ? (
                <div className="px-4 py-6 text-center text-sm text-muted-foreground">
                  No results for &quot;{searchQuery}&quot;
                </div>
              ) : (
                (() => {
                  const grouped = filteredItems.reduce<Record<string, typeof filteredItems>>((acc, item) => {
                    if (!acc[item.category]) acc[item.category] = [];
                    acc[item.category].push(item);
                    return acc;
                  }, {});

                  let globalIdx = 0;
                  return Object.entries(grouped).map(([category, items]) => (
                    <div key={category}>
                      <p className="px-4 py-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                        {category}
                      </p>
                      {items.map((item) => {
                        const idx = globalIdx++;
                        return (
                          <button
                            key={item.href}
                            onClick={() => navigateTo(item.href)}
                            className={cn(
                              "w-full flex items-center gap-3 px-4 py-2 text-sm transition-colors text-left",
                              idx === selectedIdx
                                ? "bg-primary/10 text-primary"
                                : "hover:bg-accent text-foreground"
                            )}
                          >
                            <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                            {item.label}
                          </button>
                        );
                      })}
                    </div>
                  ));
                })()
              )}
            </div>

            {/* Footer hint */}
            <div className="flex items-center gap-4 px-4 py-2 border-t border-border bg-muted/30">
              <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <kbd className="bg-background border border-border rounded px-1 font-mono">↑↓</kbd> navigate
              </span>
              <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <kbd className="bg-background border border-border rounded px-1 font-mono">↵</kbd> open
              </span>
              <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <kbd className="bg-background border border-border rounded px-1 font-mono">ESC</kbd> close
              </span>
            </div>
          </div>
        </div>
      )}
    </TooltipProvider>
  );
}
