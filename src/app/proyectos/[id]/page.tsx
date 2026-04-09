import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getProject } from "@/lib/data/projects";
import ProjectDetailClient from "@/components/proyectos/ProjectDetailClient";

async function ProjectDetail({ id }: { id: string }) {
  const project = await getProject(id);
  if (!project) notFound();
  return <ProjectDetailClient project={project} />;
}

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-64 text-gray-400 text-sm">
          Cargando...
        </div>
      }
    >
      <ProjectDetail id={id} />
    </Suspense>
  );
}
