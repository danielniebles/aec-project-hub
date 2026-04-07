"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import PageHeader from "@/components/layout/PageHeader";
import AddAPUItemModal from "@/components/proyectos/AddAPUItemModal";
import { formatCOP } from "@/lib/format";
import { STATUS_LABEL, STATUS_BADGE, TYPE_LABEL } from "@/lib/projectStatus";

type CostItem = {
  id: string;
  description: string;
  unit: string;
  quantityBudgeted: string;
  unitCostBudgeted: string;
  totalBudgeted: number;
  totalExecuted: number;
  variance: number;
  apuItem: { code: string } | null;
};

type Project = {
  id: string;
  name: string;
  code: string;
  type: string;
  status: string;
  location: string | null;
  costItems: CostItem[];
};

const TABS = ["Resumen", "Presupuesto", "Fases", "Contratos"];

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("Presupuesto");
  const [showAddItem, setShowAddItem] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch(`/api/projects/${id}`);
    setProject(await res.json());
    setLoading(false);
  }, [id]);

  useEffect(() => { load(); }, [load]);

  async function handleRemoveItem(costItemId: string) {
    await fetch(`/api/projects/${id}/cost-items?costItemId=${costItemId}`, { method: "DELETE" });
    load();
  }

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-400 text-sm">Cargando...</div>;
  if (!project) return <div className="p-8 text-red-500">Proyecto no encontrado.</div>;

  const totalBudgeted = project.costItems.reduce((s, i) => s + i.totalBudgeted, 0);
  const totalExecuted = project.costItems.reduce((s, i) => s + i.totalExecuted, 0);
  const variance = totalExecuted - totalBudgeted;
  const pctExecuted = totalBudgeted > 0 ? (totalExecuted / totalBudgeted) * 100 : 0;

  const badge = STATUS_BADGE[project.status] ?? "bg-gray-100 text-gray-600";
  const statusLabel = STATUS_LABEL[project.status] ?? project.status;
  const typeLabel = TYPE_LABEL[project.type] ?? project.type;

  return (
    <div className="flex flex-col h-full">
      <PageHeader title="">
        <input
          placeholder="Buscar en el proyecto..."
          className="border border-gray-200 rounded-lg px-4 py-1.5 text-sm w-64 focus:outline-none focus:border-teal-500"
        />
      </PageHeader>

      <div className="flex-1 overflow-auto px-8 py-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-400 mb-3">
          <Link href="/proyectos" className="hover:text-teal-600">Proyectos</Link>
          <span>›</span>
          <span className="text-gray-600">{project.name}</span>
        </div>

        {/* Project title row */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-3xl font-bold text-gray-900">{project.name}</h1>
              <span className={`text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide ${badge}`}>
                {statusLabel}
              </span>
            </div>
            <p className="text-sm text-gray-500 flex items-center gap-2">
              <span>▦</span>
              <span>{typeLabel}</span>
              {project.location && <><span className="text-gray-300">|</span><span>{project.location}</span></>}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button className="px-4 py-2 rounded-lg text-sm font-medium border border-gray-200 text-gray-600 hover:bg-gray-50">
              Exportar PDF
            </button>
            <button
              onClick={() => setShowAddItem(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white"
              style={{ backgroundColor: "#0d9488" }}
            >
              + Nuevo Ítem
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-6 border-b border-gray-200 mb-6">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="pb-3 text-sm font-medium transition-colors"
              style={activeTab === tab
                ? { color: "#0d9488", borderBottom: "2px solid #0d9488" }
                : { color: "#9ca3af" }
              }
            >
              {tab}
            </button>
          ))}
        </div>

        {activeTab !== "Presupuesto" && (
          <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
            Módulo en desarrollo — disponible próximamente.
          </div>
        )}

        {activeTab === "Presupuesto" && (
          <>
            {/* Summary cards */}
            <div className="grid grid-cols-4 gap-4 mb-6">
              <div className="bg-white rounded-xl p-5 shadow-sm">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Presupuesto total</p>
                <p className="text-xl font-bold text-gray-900">{formatCOP(totalBudgeted)}</p>
              </div>
              <div className="bg-white rounded-xl p-5 shadow-sm">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Ejecutado</p>
                <p className="text-xl font-bold text-gray-900">{formatCOP(totalExecuted)}</p>
              </div>
              <div className="bg-white rounded-xl p-5 shadow-sm">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Variación</p>
                <div className="flex items-center gap-2">
                  <p className={`text-xl font-bold ${variance > 0 ? "text-red-500" : "text-gray-900"}`}>
                    {variance > 0 ? "+" : ""}{formatCOP(variance)}
                  </p>
                  {totalBudgeted > 0 && (
                    <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${variance > 0 ? "bg-red-100 text-red-600" : "bg-green-100 text-green-600"}`}>
                      {variance > 0 ? "+" : ""}{((variance / totalBudgeted) * 100).toFixed(1)}%
                    </span>
                  )}
                </div>
              </div>
              <div className="bg-white rounded-xl p-5 shadow-sm">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">% Ejecutado</p>
                <p className="text-xl font-bold text-teal-600">{pctExecuted.toFixed(1)}%</p>
                <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${Math.min(pctExecuted, 100)}%`, backgroundColor: "#0d9488" }} />
                </div>
              </div>
            </div>

            {/* Budget table */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Código APU</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Descripción</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Und</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Cant.</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Precio unit.</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Presupuestado</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Ejecutado</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Var.</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {project.costItems.length === 0 && (
                    <tr>
                      <td colSpan={9} className="px-5 py-10 text-center text-gray-400 text-sm">
                        Sin ítems de presupuesto. Usa "+ Nuevo Ítem" para agregar APUs.
                      </td>
                    </tr>
                  )}
                  {project.costItems.map((item) => {
                    const overBudget = item.variance > 0;
                    return (
                      <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                        <td className="px-5 py-3 font-mono text-teal-600 font-semibold text-xs">
                          {item.apuItem?.code ?? "—"}
                        </td>
                        <td className="px-4 py-3 text-gray-800">{item.description}</td>
                        <td className="px-4 py-3 text-gray-500">{item.unit}</td>
                        <td className="px-4 py-3 text-right text-gray-700">{parseFloat(item.quantityBudgeted).toFixed(1)}</td>
                        <td className="px-4 py-3 text-right text-gray-700">{formatCOP(item.unitCostBudgeted)}</td>
                        <td className="px-4 py-3 text-right font-medium text-gray-800">{formatCOP(item.totalBudgeted)}</td>
                        <td className="px-4 py-3 text-right text-gray-700">{formatCOP(item.totalExecuted)}</td>
                        <td className="px-4 py-3 text-center text-lg">
                          {item.totalExecuted === 0
                            ? <span className="text-gray-300">—</span>
                            : overBudget
                              ? <span className="text-red-500">↗</span>
                              : <span className="text-green-500">↘</span>
                          }
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => handleRemoveItem(item.id)}
                            className="text-gray-300 hover:text-red-400 transition-colors"
                            title="Eliminar ítem"
                          >
                            🗑
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Add item row */}
              <button
                onClick={() => setShowAddItem(true)}
                className="w-full py-4 flex items-center justify-center gap-2 text-sm text-gray-400 hover:text-teal-600 border-t border-dashed border-gray-200 hover:bg-gray-50 transition-colors"
              >
                <span className="text-lg">⊕</span> Agregar ítem APU
              </button>
            </div>

            {/* Footer legend */}
            <div className="flex items-center justify-end gap-4 mt-3 text-xs text-gray-400">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500 inline-block" /> Bajo presupuesto</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500 inline-block" /> Sobre presupuesto</span>
            </div>
          </>
        )}
      </div>

      {showAddItem && (
        <AddAPUItemModal
          projectId={id}
          onClose={() => setShowAddItem(false)}
          onAdded={() => { setShowAddItem(false); load(); }}
        />
      )}
    </div>
  );
}
