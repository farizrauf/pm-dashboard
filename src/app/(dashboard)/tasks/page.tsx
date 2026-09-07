import { getTasks } from "@/actions/tasks";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { Header } from "@/components/layout/header";
import { TasksClient } from "@/components/tasks/tasks-client";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "My Tasks" };
export const revalidate = 30;

interface PageProps {
  searchParams: Promise<{
    view?: string;
    status?: string;
    priority?: string;
    project?: string;
    search?: string;
    page?: string;
  }>;
}

export default async function TasksPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const session = await auth();

  const [tasksData, projects] = await Promise.all([
    getTasks({
      status: params.status,
      priority: params.priority,
      projectId: params.project,
      search: params.search,
      page: params.page ? parseInt(params.page) : 1,
    }),
    prisma.project.findMany({
      where: {
        OR: [
          { creatorId: session!.user!.id! },
          { members: { some: { userId: session!.user!.id! } } },
        ],
      },
      select: { id: true, name: true, color: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div className="flex flex-col h-full">
      <Header
        title="My Tasks"
        description={`${tasksData.total} task${tasksData.total !== 1 ? "s" : ""} total`}
      />
      <div className="flex-1 p-6 overflow-auto">
        <TasksClient
          initialTasks={tasksData.tasks}
          total={tasksData.total}
          pages={tasksData.pages}
          projects={projects}
          searchParams={params}
        />
      </div>
    </div>
  );
}
