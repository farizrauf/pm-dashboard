import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getActiveWorkspace } from "@/lib/workspaces";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ results: [] }, { status: 401 });
  }

  const query = new URL(request.url).searchParams.get("q")?.trim();
  if (!query || query.length < 2) return NextResponse.json({ results: [] });

  const workspace = await getActiveWorkspace(session.user.id);
  if (!workspace) return NextResponse.json({ results: [] });

  const projectAccess = {
    workspaceId: workspace.id,
    OR: [
      { creatorId: session.user.id },
      { members: { some: { userId: session.user.id } } },
    ],
  };

  const [projects, tasks, milestones, risks, issues, invoices] = await Promise.all([
    prisma.project.findMany({
      where: { ...projectAccess, name: { contains: query, mode: "insensitive" } },
      select: { id: true, name: true },
      take: 5,
    }),
    prisma.task.findMany({
      where: {
        title: { contains: query, mode: "insensitive" },
        project: projectAccess,
      },
      select: { id: true, title: true, project: { select: { name: true } } },
      take: 8,
    }),
    prisma.milestone.findMany({
      where: { title: { contains: query, mode: "insensitive" }, project: projectAccess },
      select: { id: true, title: true, project: { select: { name: true } } },
      take: 5,
    }),
    prisma.risk.findMany({
      where: { title: { contains: query, mode: "insensitive" }, project: projectAccess },
      select: { id: true, title: true, project: { select: { name: true } } },
      take: 5,
    }),
    prisma.issue.findMany({
      where: { title: { contains: query, mode: "insensitive" }, project: projectAccess },
      select: { id: true, title: true, project: { select: { name: true } } },
      take: 5,
    }),
    prisma.invoice.findMany({
      where: {
        OR: [
          { title: { contains: query, mode: "insensitive" } },
          { invoiceNo: { contains: query, mode: "insensitive" } },
        ],
        budget: { project: projectAccess },
      },
      select: { id: true, title: true, invoiceNo: true },
      take: 5,
    }),
  ]);

  const results = [
    ...projects.map((item) => ({ id: `project-${item.id}`, label: item.name, category: "Projects", href: `/projects/${item.id}` })),
    ...tasks.map((item) => ({ id: `task-${item.id}`, label: item.title, detail: item.project?.name, category: "Tasks", href: "/tasks" })),
    ...milestones.map((item) => ({ id: `milestone-${item.id}`, label: item.title, detail: item.project.name, category: "Milestones", href: "/milestones" })),
    ...risks.map((item) => ({ id: `risk-${item.id}`, label: item.title, detail: item.project.name, category: "Risks", href: "/risks" })),
    ...issues.map((item) => ({ id: `issue-${item.id}`, label: item.title, detail: item.project.name, category: "Issues", href: "/issues" })),
    ...invoices.map((item) => ({ id: `invoice-${item.id}`, label: item.title, detail: item.invoiceNo, category: "Invoices", href: "/invoices" })),
  ];

  return NextResponse.json({ results });
}
