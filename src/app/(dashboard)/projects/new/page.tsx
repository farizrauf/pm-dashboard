import { Header } from "@/components/layout/header";
import { ProjectForm } from "@/components/projects/project-form";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "New Project" };

export default function NewProjectPage() {
  return (
    <div className="flex flex-col h-full">
      <Header title="New Project" description="Create a new project for your team" />
      <div className="flex-1 p-6 overflow-auto">
        <ProjectForm />
      </div>
    </div>
  );
}
