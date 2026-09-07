import { getProject } from "@/actions/projects";
import { Header } from "@/components/layout/header";
import { ProjectForm } from "@/components/projects/project-form";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Edit Project" };

export default async function EditProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const project = await getProject(id);
  if (!project) notFound();

  return (
    <div className="flex flex-col h-full">
      <Header title="Edit Project" description={project.name} />
      <div className="flex-1 p-6 overflow-auto">
        <ProjectForm project={project} />
      </div>
    </div>
  );
}
