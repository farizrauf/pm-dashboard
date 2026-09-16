import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export const ACTIVE_WORKSPACE_COOKIE = "active-workspace";

export async function getUserWorkspaces(userId: string) {
  return prisma.workspace.findMany({
    where: { members: { some: { userId } } },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      name: true,
      slug: true,
      plan: true,
      members: { where: { userId }, select: { role: true } },
    },
  });
}

export async function getActiveWorkspace(userId: string) {
  const cookieStore = await cookies();
  const requestedId = cookieStore.get(ACTIVE_WORKSPACE_COOKIE)?.value;

  if (requestedId) {
    const requested = await prisma.workspace.findFirst({
      where: { id: requestedId, members: { some: { userId } } },
    });
    if (requested) return requested;
  }

  return prisma.workspace.findFirst({
    where: { members: { some: { userId } } },
    orderBy: { createdAt: "asc" },
  });
}

export function workspaceSlug(name: string) {
  return `${name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "workspace"}-${Math.random().toString(36).slice(2, 8)}`;
}
