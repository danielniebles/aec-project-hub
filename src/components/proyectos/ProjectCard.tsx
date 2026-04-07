import Link from "next/link";
import { formatCOP } from "@/lib/format";
import { STATUS_LABEL, STATUS_BADGE, STATUS_BORDER, TYPE_LABEL } from "@/lib/projectStatus";

export type ProjectSummary = {
  id: string;
  name: string;
  code: string;
  type: string;
  status: string;
  location: string | null;
  totalBudgeted: number;
  itemCount: number;
};

export default function ProjectCard({ project }: { project: ProjectSummary }) {
  const borderColor = STATUS_BORDER[project.status] ?? "border-gray-300";
  const badge = STATUS_BADGE[project.status] ?? "bg-gray-100 text-gray-600";
  const statusLabel = STATUS_LABEL[project.status] ?? project.status;
  const typeLabel = TYPE_LABEL[project.type] ?? project.type;

  return (
    <Link href={`/proyectos/${project.id}`}>
      <div className={`bg-white rounded-xl border-l-4 ${borderColor} shadow-sm p-5 hover:shadow-md transition-shadow cursor-pointer h-full`}>
        <div className="flex items-start justify-between mb-3">
          <span className="text-xs font-mono text-gray-400 tracking-wide">COD: {project.code}</span>
          <span className={`text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wide ${badge}`}>
            {statusLabel}
          </span>
        </div>

        <h3 className="text-lg font-bold text-gray-900 leading-tight mb-2">{project.name}</h3>

        <div className="flex items-center gap-2 mb-4">
          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-medium">{typeLabel}</span>
          {project.location && (
            <span className="text-xs text-gray-400 flex items-center gap-1">
              <span>📍</span>{project.location}
            </span>
          )}
        </div>

        <div className="border-t border-gray-100 pt-4 flex justify-between">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold">Presupuesto total</p>
            <p className="text-sm font-bold text-gray-800 mt-0.5">{formatCOP(project.totalBudgeted)}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold">Ítems APU</p>
            <p className="text-sm font-bold text-gray-800 mt-0.5">{project.itemCount}</p>
          </div>
        </div>
      </div>
    </Link>
  );
}
