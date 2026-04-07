"use client";

import { useEffect, useState } from "react";
import PageHeader from "@/components/layout/PageHeader";
import ProjectCard, { ProjectSummary } from "@/components/proyectos/ProjectCard";
import ProjectForm from "@/components/proyectos/ProjectForm";
import { STATUS_LABEL } from "@/lib/projectStatus";

const FILTERS = ["todos", "prospect", "design", "execution", "closeout", "closed"];
const FILTER_LABELS: Record<string, string> = {
  todos: "Todos", ...Object.fromEntries(
    Object.entries(STATUS_LABEL).map(([k, v]) => [k, v])
  ),
};

export default function ProyectosPage() {
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("todos");
  const [showForm, setShowForm] = useState(false);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/projects");
    setProjects(await res.json());
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  const filtered = filter === "todos" ? projects : projects.filter((p) => p.status === filter);

  return (
    <div className="flex flex-col h-full">
      <PageHeader title="">
        <input
          type="text"
          placeholder="Buscar proyecto..."
          className="border border-gray-200 rounded-lg px-4 py-1.5 text-sm w-64 focus:outline-none focus:border-teal-500"
        />
      </PageHeader>

      <div className="flex-1 overflow-auto px-8 py-6">
        {/* Title row */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Proyectos</h1>
            <p className="text-sm text-gray-400 mt-1">Gestiona y supervisa el estado financiero de tus obras.</p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white shadow-sm"
            style={{ backgroundColor: "#0d9488" }}
          >
            + Nuevo proyecto
          </button>
        </div>

        {/* Filter tabs */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
            {FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className="px-4 py-1.5 rounded-lg text-sm font-medium transition-colors"
                style={filter === f
                  ? { backgroundColor: "white", color: "#0d9488", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }
                  : { color: "#6b7280" }
                }
              >
                {FILTER_LABELS[f]}
              </button>
            ))}
          </div>
          {!loading && (
            <span className="text-sm text-gray-400">
              Mostrando {filtered.length} proyecto{filtered.length !== 1 ? "s" : ""} activo{filtered.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        {/* Cards grid */}
        {loading ? (
          <div className="flex items-center justify-center h-48 text-gray-400 text-sm">Cargando proyectos...</div>
        ) : (
          <div className="grid grid-cols-3 gap-5">
            {filtered.map((p) => (
              <ProjectCard key={p.id} project={p} />
            ))}

            {/* Create new card */}
            <button
              onClick={() => setShowForm(true)}
              className="bg-white rounded-xl border-2 border-dashed border-gray-200 p-5 flex flex-col items-center justify-center gap-3 hover:border-teal-400 transition-colors min-h-[200px]"
            >
              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-2xl text-gray-400">
                +
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-gray-700">Crear Nuevo Proyecto</p>
                <p className="text-xs text-gray-400 mt-1">Inicia un nuevo presupuesto o<br />importa una cotización previa.</p>
              </div>
            </button>
          </div>
        )}
      </div>

      {showForm && (
        <ProjectForm
          onClose={() => setShowForm(false)}
          onCreated={() => { setShowForm(false); load(); }}
        />
      )}
    </div>
  );
}
