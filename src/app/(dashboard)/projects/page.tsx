import { getProjects } from "@/actions/projects";
import { Header } from "@/components/layout/header";
import { ProjectsClient } from "@/components/projects/projects-client";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Projects" };
export const revalidate = 30;

interface PageProps {
  searchParams: Promise<{ search?: string; status?: string; priority?: string; page?: string }>;
}

export default async function ProjectsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const { projects, total, pages } = await getProjects({
    search: params.search,
    status: params.status,
    priority: params.priority,
    page: params.page ? parseInt(params.page) : 1,
  });

  return (
    <div className="flex flex-col h-full">
      <Header
        title="Projects"
        description={`${total} project${total !== 1 ? "s" : ""} in your workspace`}
        actions={
          <Button size="sm" asChild>
            <Link href="/projects/new">
              <Plus className="h-4 w-4" />
              New Project
            </Link>
          </Button>
        }
      />
      <div className="flex-1 p-6 overflow-auto">
        <ProjectsClient
          initialProjects={projects}
          total={total}
          pages={pages}
          searchParams={params}
        />
      </div>
    </div>
  );
}
