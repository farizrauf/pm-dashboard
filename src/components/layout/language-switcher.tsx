"use client";

import { useLocale } from "@/hooks/use-locale";
import { Globe } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface LanguageSwitcherProps {
  collapsed?: boolean;
  variant?: "icon" | "full";
  sidebarMode?: boolean;
}

const LANGUAGES = [
  { code: "en", label: "English", flag: "🇺🇸" },
  { code: "id", label: "Indonesia", flag: "🇮🇩" },
] as const;

export function LanguageSwitcher({ collapsed, variant = "icon", sidebarMode }: LanguageSwitcherProps) {
  const { locale, setLocale } = useLocale();
  const current = LANGUAGES.find((l) => l.code === locale) ?? LANGUAGES[0];

  const sidebarStyle = sidebarMode
    ? { color: "hsl(var(--sidebar-fg-muted))" }
    : undefined;

  const trigger =
    variant === "full" ? (
      <Button variant="outline" size="sm" className="gap-2 h-8">
        <Globe className="h-3.5 w-3.5" />
        <span>{current.flag} {current.label}</span>
      </Button>
    ) : collapsed ? (
      <button
        style={sidebarStyle}
        className={cn(
          "flex h-9 w-9 items-center justify-center rounded-lg transition-all",
          sidebarMode
            ? "hover:bg-white/10"
            : "text-muted-foreground hover:bg-accent hover:text-foreground"
        )}
        title="Change language"
      >
        <Globe className="h-4 w-4" />
      </button>
    ) : (
      <button
        style={sidebarStyle}
        className={cn(
          "flex h-9 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-all w-full",
          sidebarMode
            ? "hover:bg-white/10"
            : "hover:bg-accent hover:text-foreground text-muted-foreground"
        )}
        title="Change language"
      >
        <Globe className="h-4 w-4 shrink-0" />
        <span className={cn(collapsed && "sr-only", "truncate")}>
          {current.flag} {current.label}
        </span>
      </button>
    );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
      <DropdownMenuContent align={collapsed ? "end" : "start"} side="top" className="w-44">
        {LANGUAGES.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => setLocale(lang.code)}
            className={cn("gap-2", locale === lang.code && "font-medium bg-accent")}
          >
            <span>{lang.flag}</span>
            <span>{lang.label}</span>
            {locale === lang.code && (
              <span className="ml-auto text-xs text-muted-foreground">✓</span>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
