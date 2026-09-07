"use client";

import { Bell, Moon, Sun, Search } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface HeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}

export function Header({ title, description, actions }: HeaderProps) {
  const { theme, setTheme } = useTheme();

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

          <div className="hidden md:flex items-center gap-1 h-8 rounded-md border border-input bg-background px-2.5 text-sm text-muted-foreground w-48">
            <Search className="h-3.5 w-3.5 shrink-0" />
            <span className="text-xs">Search...</span>
            <kbd className="ml-auto text-[10px] font-mono bg-muted rounded px-1">⌘K</kbd>
          </div>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Bell className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Notifications</TooltipContent>
          </Tooltip>

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
    </TooltipProvider>
  );
}
