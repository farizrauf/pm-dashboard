"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Plus, Search, Pencil, Trash2, MoreHorizontal,
  KeyRound, Shield, User, Eye, Loader2, Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { createUser, updateUser, deleteUser, resetUserPassword } from "@/actions/admin";
import { ExportButton } from "@/components/shared/export-button";
import { ImportDialog } from "@/components/shared/import-dialog";
import { toast } from "sonner";
import { getInitials, formatDate } from "@/lib/utils";

type UserRow = {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  role: string;
  createdAt: Date;
  _count: { assignedTasks: number; projectMembers: number };
};

interface UserManagementClientProps {
  users: UserRow[];
}

const ROLE_CONFIG: Record<string, { label: string; icon: React.ElementType; variant: "default" | "destructive" | "secondary" | "outline" | "success" | "warning" | "info" }> = {
  ADMIN:  { label: "Admin",  icon: Shield, variant: "destructive" },
  MEMBER: { label: "Member", icon: User,   variant: "default" },
  VIEWER: { label: "Viewer", icon: Eye,    variant: "secondary" },
};

type FormMode = "create" | "edit" | "reset-password";

const emptyForm = { name: "", email: "", password: "", confirmPassword: "", role: "MEMBER" };

export function UserManagementClient({ users: initialUsers }: UserManagementClientProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<FormMode>("create");
  const [editingUser, setEditingUser] = useState<UserRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<UserRow | null>(null);
  const [formValues, setFormValues] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [importOpen, setImportOpen] = useState(false);

  const filtered = initialUsers.filter(
    (u) =>
      !search ||
      u.name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );

  const openCreate = () => {
    setFormMode("create");
    setEditingUser(null);
    setFormValues(emptyForm);
    setFormOpen(true);
  };

  const openEdit = (user: UserRow) => {
    setFormMode("edit");
    setEditingUser(user);
    setFormValues({ name: user.name ?? "", email: user.email, password: "", confirmPassword: "", role: user.role });
    setFormOpen(true);
  };

  const openResetPassword = (user: UserRow) => {
    setFormMode("reset-password");
    setEditingUser(user);
    setFormValues({ ...emptyForm, name: user.name ?? "", email: user.email });
    setFormOpen(true);
  };

  const handleSubmit = async () => {
    if (formMode === "create") {
      if (!formValues.name.trim() || !formValues.email.trim() || !formValues.password) {
        toast.error("Name, email and password are required");
        return;
      }
      if (formValues.password !== formValues.confirmPassword) {
        toast.error("Passwords do not match");
        return;
      }
      setLoading(true);
      const res = await createUser({
        name: formValues.name,
        email: formValues.email,
        password: formValues.password,
        role: formValues.role as "ADMIN" | "MEMBER" | "VIEWER",
      });
      setLoading(false);
      if ("error" in res && res.error) { toast.error(res.error); return; }
      toast.success("User created");
      setFormOpen(false);
      router.refresh();

    } else if (formMode === "edit" && editingUser) {
      if (!formValues.name.trim() || !formValues.email.trim()) {
        toast.error("Name and email are required");
        return;
      }
      if (formValues.password && formValues.password !== formValues.confirmPassword) {
        toast.error("Passwords do not match");
        return;
      }
      setLoading(true);
      const res = await updateUser(editingUser.id, {
        name: formValues.name,
        email: formValues.email,
        role: formValues.role as "ADMIN" | "MEMBER" | "VIEWER",
        password: formValues.password || undefined,
      });
      setLoading(false);
      if ("error" in res && res.error) { toast.error(res.error); return; }
      toast.success("User updated");
      setFormOpen(false);
      router.refresh();

    } else if (formMode === "reset-password" && editingUser) {
      if (!formValues.password || formValues.password.length < 8) {
        toast.error("Password must be at least 8 characters");
        return;
      }
      if (formValues.password !== formValues.confirmPassword) {
        toast.error("Passwords do not match");
        return;
      }
      setLoading(true);
      const res = await resetUserPassword(editingUser.id, formValues.password);
      setLoading(false);
      if ("error" in res && res.error) { toast.error(res.error); return; }
      toast.success("Password reset successfully");
      setFormOpen(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setLoading(true);
    const res = await deleteUser(deleteTarget.id);
    setLoading(false);
    if ("error" in res && res.error) { toast.error(res.error); return; }
    toast.success("User deleted");
    setDeleteTarget(null);
    router.refresh();
  };

  return (
    <>
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            className="pl-8 h-8 text-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs" onClick={() => setImportOpen(true)}>
            <Upload className="h-3.5 w-3.5" /> Import Users
          </Button>
          <ExportButton type="users" />
          <Button size="sm" className="h-8 gap-1.5" onClick={openCreate}>
            <Plus className="h-3.5 w-3.5" /> Add User
          </Button>
        </div>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: "Total Users", value: initialUsers.length },
          { label: "Admins", value: initialUsers.filter((u) => u.role === "ADMIN").length },
          { label: "Members", value: initialUsers.filter((u) => u.role === "MEMBER").length },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-border bg-card p-4">
            <p className="text-2xl font-bold">{s.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Users table */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <User className="h-10 w-10 text-muted-foreground mb-3" />
          <p className="text-base font-medium">No users found</p>
          <p className="text-sm text-muted-foreground mt-1">Try a different search term.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-border overflow-hidden bg-card">
          {/* Header */}
          <div className="grid grid-cols-[minmax(0,1fr)_120px_100px_100px_80px_40px] gap-3 px-4 py-2.5 border-b border-border bg-muted/30 text-xs font-medium text-muted-foreground">
            <span>User</span>
            <span>Role</span>
            <span>Tasks</span>
            <span>Projects</span>
            <span>Joined</span>
            <span />
          </div>

          {filtered.map((user) => {
            const roleCfg = ROLE_CONFIG[user.role] ?? ROLE_CONFIG.MEMBER;
            const RoleIcon = roleCfg.icon;
            return (
              <div
                key={user.id}
                className="grid grid-cols-[minmax(0,1fr)_120px_100px_100px_80px_40px] gap-3 px-4 py-3 border-b border-border last:border-0 hover:bg-accent/30 transition-colors items-center group"
              >
                {/* User info */}
                <div className="flex items-center gap-2.5 min-w-0">
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarImage src={user.image ?? ""} />
                    <AvatarFallback className="text-xs">{getInitials(user.name)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{user.name ?? "—"}</p>
                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                  </div>
                </div>

                {/* Role badge */}
                <Badge variant={roleCfg.variant} className="gap-1 w-fit">
                  <RoleIcon className="h-3 w-3" />
                  {roleCfg.label}
                </Badge>

                {/* Tasks */}
                <span className="text-sm text-muted-foreground">
                  {user._count.assignedTasks}
                </span>

                {/* Projects */}
                <span className="text-sm text-muted-foreground">
                  {user._count.projectMembers}
                </span>

                {/* Joined */}
                <span className="text-xs text-muted-foreground">
                  {formatDate(user.createdAt)}
                </span>

                {/* Actions */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity">
                      <MoreHorizontal className="h-3.5 w-3.5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => openEdit(user)} className="gap-2">
                      <Pencil className="h-3.5 w-3.5" /> Edit User
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => openResetPassword(user)} className="gap-2">
                      <KeyRound className="h-3.5 w-3.5" /> Reset Password
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => setDeleteTarget(user)}
                      className="gap-2 text-destructive focus:text-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Delete User
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit / Reset Password dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {formMode === "create" ? "Add New User" :
               formMode === "edit" ? "Edit User" : "Reset Password"}
            </DialogTitle>
            {formMode === "reset-password" && (
              <DialogDescription>
                Set a new password for <strong>{editingUser?.name ?? editingUser?.email}</strong>
              </DialogDescription>
            )}
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Name & Email (not for reset-password) */}
            {formMode !== "reset-password" && (
              <>
                <div className="space-y-1.5">
                  <Label htmlFor="user-name">Display Name *</Label>
                  <Input
                    id="user-name"
                    value={formValues.name}
                    onChange={(e) => setFormValues((p) => ({ ...p, name: e.target.value }))}
                    placeholder="Full name"
                    autoFocus
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="user-email">Email Address *</Label>
                  <Input
                    id="user-email"
                    type="email"
                    value={formValues.email}
                    onChange={(e) => setFormValues((p) => ({ ...p, email: e.target.value }))}
                    placeholder="user@example.com"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Role</Label>
                  <Select
                    value={formValues.role}
                    onValueChange={(v) => setFormValues((p) => ({ ...p, role: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ADMIN">Admin</SelectItem>
                      <SelectItem value="MEMBER">Member</SelectItem>
                      <SelectItem value="VIEWER">Viewer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            {/* Password fields */}
            <div className="space-y-1.5">
              <Label htmlFor="user-password">
                {formMode === "create" ? "Password *" :
                 formMode === "edit" ? "New Password (leave blank to keep current)" :
                 "New Password *"}
              </Label>
              <Input
                id="user-password"
                type="password"
                value={formValues.password}
                onChange={(e) => setFormValues((p) => ({ ...p, password: e.target.value }))}
                placeholder={formMode === "edit" ? "Leave blank to keep current" : "Min. 8 characters"}
                autoFocus={formMode === "reset-password"}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="user-confirm-password">Confirm Password</Label>
              <Input
                id="user-confirm-password"
                type="password"
                value={formValues.confirmPassword}
                onChange={(e) => setFormValues((p) => ({ ...p, confirmPassword: e.target.value }))}
                placeholder="Repeat password"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={loading}>
              {loading ? (
                <><Loader2 className="h-3.5 w-3.5 animate-spin mr-2" /> Saving...</>
              ) : formMode === "create" ? "Create User" :
                 formMode === "edit" ? "Save Changes" : "Reset Password"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{deleteTarget?.name ?? deleteTarget?.email}</strong>?
              This action cannot be undone and will remove all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive hover:bg-destructive/90"
              disabled={loading}
            >
              {loading ? "Deleting..." : "Delete User"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Import users dialog */}
      <ImportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        type="users"
        onSuccess={() => { setImportOpen(false); router.refresh(); }}
      />
    </>
  );
}
