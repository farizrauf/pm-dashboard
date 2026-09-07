"use client";

import { useSession, signOut } from "next-auth/react";
import { LogOut, User, Settings } from "lucide-react";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export function UserNav({ collapsed, sidebarMode }: { collapsed?: boolean; sidebarMode?: boolean }) {
  const { data: session } = useSession();
  const user = session?.user;

  const baseBtn = sidebarMode
    ? `flex items-center gap-2.5 rounded-lg transition-all hover:bg-white/10 w-full text-left mt-0.5 ${collapsed ? "justify-center p-2" : "px-2.5 py-1.5"}`
    : `flex items-center gap-2.5 rounded-md transition-colors hover:bg-accent w-full text-left mt-1 ${collapsed ? "justify-center p-1" : "px-2.5 py-1.5"}`;

  const trigger = (
    <button className={baseBtn}>
      <Avatar className="h-7 w-7 shrink-0">
        <AvatarImage src={user?.image ?? ""} alt={user?.name ?? ""} />
        <AvatarFallback className="text-[10px]">{getInitials(user?.name)}</AvatarFallback>
      </Avatar>
      {!collapsed && (
        <div className="flex-1 min-w-0">
          <p
            className="text-xs font-medium truncate leading-none"
            style={sidebarMode ? { color: "hsl(var(--sidebar-fg))" } : undefined}
          >
            {user?.name}
          </p>
          <p
            className="text-[11px] truncate mt-0.5"
            style={sidebarMode ? { color: "hsl(var(--sidebar-fg-muted))" } : undefined}
          >
            {user?.email}
          </p>
        </div>
      )}
    </button>
  );

  return (
    <DropdownMenu>
      {collapsed ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent side="right">Account</TooltipContent>
        </Tooltip>
      ) : (
        <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
      )}
      <DropdownMenuContent align="end" side="top" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user?.name}</p>
            <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/settings/profile" className="gap-2">
            <User className="h-4 w-4" />
            Profile
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/settings" className="gap-2">
            <Settings className="h-4 w-4" />
            Settings
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="gap-2 text-destructive focus:text-destructive"
          onClick={() => signOut({ callbackUrl: "/login" })}
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
