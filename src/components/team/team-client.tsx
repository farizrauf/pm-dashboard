"use client";

import { useState } from "react";
import { Search, Briefcase, CheckSquare } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn, getInitials } from "@/lib/utils";

type Member = {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  role: string;
  activeTasks: number;
  activeProjects: number;
  projects: { id: string; name: string; status: string; color: string }[];
};

interface TeamClientProps {
  members: Member[];
}

const ROLE_COLORS: Record<string, string> = {
  ADMIN: "bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400",
  MEMBER: "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400",
  VIEWER: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400",
};

export function TeamClient({ members }: TeamClientProps) {
  const [search, setSearch] = useState("");

  const filtered = members.filter(
    (m) =>
      !search ||
      m.name?.toLowerCase().includes(search.toLowerCase()) ||
      m.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-5">
      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <Input
          placeholder="Search team members..."
          className="pl-8 h-8 text-sm"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Total Members</p>
            <p className="text-2xl font-bold mt-0.5">{members.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Total Active Tasks</p>
            <p className="text-2xl font-bold mt-0.5">{members.reduce((s, m) => s + m.activeTasks, 0)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Avg Tasks/Member</p>
            <p className="text-2xl font-bold mt-0.5">
              {members.length ? Math.round(members.reduce((s, m) => s + m.activeTasks, 0) / members.length) : 0}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Member grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-sm text-muted-foreground">No members found</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((member) => (
            <MemberCard key={member.id} member={member} />
          ))}
        </div>
      )}
    </div>
  );
}

function MemberCard({ member }: { member: Member }) {
  const maxWorkload = 10;
  const workloadPct = Math.min((member.activeTasks / maxWorkload) * 100, 100);
  const workloadColor =
    workloadPct >= 80 ? "bg-red-500" : workloadPct >= 50 ? "bg-amber-500" : "bg-emerald-500";

  return (
    <Card className="hover:shadow-md transition-all">
      <CardContent className="p-5">
        {/* Header */}
        <div className="flex items-start gap-3 mb-4">
          <Avatar className="h-10 w-10 shrink-0">
            <AvatarImage src={member.image ?? ""} alt={member.name ?? ""} />
            <AvatarFallback className="text-sm">{getInitials(member.name)}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm truncate">{member.name ?? "Unknown"}</p>
            <p className="text-xs text-muted-foreground truncate">{member.email}</p>
          </div>
          <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium shrink-0", ROLE_COLORS[member.role] ?? ROLE_COLORS.MEMBER)}>
            {member.role}
          </span>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
            <CheckSquare className="h-3.5 w-3.5 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Tasks</p>
              <p className="text-sm font-semibold">{member.activeTasks}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
            <Briefcase className="h-3.5 w-3.5 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Projects</p>
              <p className="text-sm font-semibold">{member.activeProjects}</p>
            </div>
          </div>
        </div>

        {/* Workload */}
        <div className="space-y-1.5 mb-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Workload</span>
            <span className="text-xs font-medium">{member.activeTasks} active tasks</span>
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className={cn("h-full rounded-full transition-all", workloadColor)}
              style={{ width: `${workloadPct}%` }}
            />
          </div>
        </div>

        {/* Projects */}
        {member.projects.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {member.projects.filter((p) => p.status === "ACTIVE").slice(0, 3).map((p) => (
              <span
                key={p.id}
                className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium border border-border"
              >
                <span className="h-1 w-1 rounded-full" style={{ background: p.color }} />
                {p.name}
              </span>
            ))}
            {member.projects.filter((p) => p.status === "ACTIVE").length > 3 && (
              <span className="text-[10px] text-muted-foreground self-center">
                +{member.projects.filter((p) => p.status === "ACTIVE").length - 3} more
              </span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
