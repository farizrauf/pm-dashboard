import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Header } from "@/components/layout/header";
import { UserManagementClient } from "@/components/admin/user-management-client";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "User Management" };

export default async function UserManagementPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  // Only admins can access this page
  const currentUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  if (currentUser?.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      role: true,
      createdAt: true,
      _count: {
        select: { assignedTasks: true, projectMembers: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="flex flex-col h-full">
      <Header
        title="User Management"
        description={`${users.length} user${users.length !== 1 ? "s" : ""} in your workspace`}
      />
      <div className="flex-1 p-6 overflow-auto">
        <UserManagementClient users={users} />
      </div>
    </div>
  );
}
