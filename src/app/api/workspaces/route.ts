import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  ACTIVE_WORKSPACE_COOKIE,
  getActiveWorkspace,
  getUserWorkspaces,
  workspaceSlug,
} from "@/lib/workspaces";

const workspaceSchema = z.object({ name: z.string().trim().min(2).max(80) });

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [workspaces, active] = await Promise.all([
    getUserWorkspaces(session.user.id),
    getActiveWorkspace(session.user.id),
  ]);

  return NextResponse.json({
    workspaces: workspaces.map(({ members, ...workspace }) => ({
      ...workspace,
      role: members[0]?.role ?? "MEMBER",
    })),
    activeId: active?.id ?? null,
  });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = workspaceSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });

  const workspace = await prisma.workspace.create({
    data: {
      name: parsed.data.name,
      slug: workspaceSlug(parsed.data.name),
      members: { create: { userId: session.user.id, role: "OWNER" } },
    },
    select: { id: true, name: true, slug: true, plan: true },
  });

  const response = NextResponse.json({ workspace }, { status: 201 });
  response.cookies.set(ACTIVE_WORKSPACE_COOKIE, workspace.id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });
  return response;
}

export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json()) as { workspaceId?: unknown };
  if (typeof body.workspaceId !== "string") {
    return NextResponse.json({ error: "workspaceId is required" }, { status: 400 });
  }

  const membership = await prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId: body.workspaceId, userId: session.user.id } },
    select: { workspaceId: true },
  });
  if (!membership) return NextResponse.json({ error: "Workspace access denied" }, { status: 403 });

  const response = NextResponse.json({ activeId: membership.workspaceId });
  response.cookies.set(ACTIVE_WORKSPACE_COOKIE, membership.workspaceId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });
  return response;
}

export async function DELETE() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const active = await getActiveWorkspace(session.user.id);
  if (!active) return NextResponse.json({ error: "Workspace not found" }, { status: 404 });

  const membership = await prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId: active.id, userId: session.user.id } },
    select: { role: true },
  });
  if (!membership || !["OWNER", "ADMIN"].includes(membership.role)) {
    return NextResponse.json({ error: "Only workspace owners and admins can delete it" }, { status: 403 });
  }

  const workspaceCount = await prisma.workspaceMember.count({ where: { userId: session.user.id } });
  if (workspaceCount <= 1) {
    return NextResponse.json({ error: "You cannot delete your only workspace" }, { status: 400 });
  }

  await prisma.$transaction(async (tx) => {
    await tx.project.deleteMany({ where: { workspaceId: active.id } });
    await tx.workspace.delete({ where: { id: active.id } });
  });

  const nextWorkspace = await prisma.workspace.findFirst({
    where: { members: { some: { userId: session.user.id } } },
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });
  const response = NextResponse.json({ deleted: true, activeId: nextWorkspace?.id ?? null });
  if (nextWorkspace) {
    response.cookies.set(ACTIVE_WORKSPACE_COOKIE, nextWorkspace.id, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
    });
  }
  return response;
}
