"use client";

import { useEffect, useState, Fragment } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import PageHeader from "@/components/layout/PageHeader";
import AddAPUItemModal from "@/components/proyectos/AddAPUItemModal";
import CommitmentForm from "@/components/proyectos/CommitmentForm";
import PaymentForm from "@/components/proyectos/PaymentForm";
import { formatCOP, formatDate } from "@/lib/format";
import { STATUS_LABEL, STATUS_BADGE, TYPE_LABEL } from "@/lib/projectStatus";

type CommitmentStatus = "Pagado" | "Parcial" | "Pendiente";

type Payment = {
  id: string;
  commitmentId: string;
  date: string;
  amount: string;
  notes: string | null;
};

type Commitment = {
  id: string;
  costItemId: string;
  resourceId: string | null;
  description: string;
  date: string;
  totalCommitted: string;
  notes: string | null;
  resource: { id: string; code: string; description: string } | null;
  payments: Payment[];
  totalPaid: number;
  totalPending: number;
  status: CommitmentStatus;
};

type CostItem = {
  id: string;
  description: string;
  unit: string;
  quantityBudgeted: string;
  unitCostBudgeted: string;
  totalBudgeted: number;
  totalCommitted: number;
  totalPaid: number;
  totalPending: number;
  apuItem: { code: string; lines: { resource: { id: string; code: string; description: string; unit: string } | null }[] } | null;
  commitments: Commitment[];
};

type Project = {
  id: string;
  name: string;
  code: string;
  type: string;
  status: string;
  location: string | null;
  costItems: CostItem[];
  totalPresupuesto: number;
  totalComprometido: number;
  totalPagado: number;
  totalPendiente: number;
};

const TABS = ["Resumen", "Presupuesto", "Fases", "Contratos"];

const STATUS_BADGE_COMMITMENT: Record<CommitmentStatus, string> = {
  Pagado: "bg-green-100 text-green-700",
  Parcial: "bg-amber-100 text-amber-700",
  Pendiente: "bg-slate-100 text-slate-600",
};

// SVG icons
const IconChevronDown = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
  </svg>
);
const IconChevronRight = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
  </svg>
);
const IconTrash = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
  </svg>
);
const IconX = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
  </svg>
);
const IconPlus = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
  </svg>
);

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("Presupuesto");
  const [showAddItem, setShowAddItem] = useState(false);
  const [addCommitmentTo, setAddCommitmentTo] = useState<CostItem | null>(null);
  const [addPaymentTo, setAddPaymentTo] = useState<Commitment | null>(null);
  const [expandedCommitments, setExpandedCommitments] = useState<Set<string>>(new Set());

  async function load() {
    const res = await fetch(`/api/projects/${id}`);
    setProject(await res.json());
    setLoading(false);
  }

  useEffect(() => { load(); }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  function toggleCommitment(commitmentId: string) {
    setExpandedCommitments((prev) => {
      const next = new Set(prev);
      next.has(commitmentId) ? next.delete(commitmentId) : next.add(commitmentId);
      return next;
    });
  }

  async function handleRemoveItem(costItemId: string) {
    await fetch(`/api/projects/${id}/cost-items?costItemId=${costItemId}`, { method: "DELETE" });
    load();
  }

  async function handleRemoveCommitment(commitmentId: string) {
    await fetch(`/api/projects/${id}/commitments?commitmentId=${commitmentId}`, { method: "DELETE" });
    load();
  }

  async function handleRemovePayment(commitmentId: string, paymentId: string) {
    await fetch(`/api/projects/${id}/commitments/${commitmentId}/payments?paymentId=${paymentId}`, { method: "DELETE" });
    load();
  }

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-400 text-sm">Cargando...</div>;
  if (!project) return <div className="p-8 text-red-500">Proyecto no encontrado.</div>;

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
              <IconPlus /> Nuevo Ítem APU
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-6 border-b border-gray-200 mb-6">
          {TABS.map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className="pb-3 text-sm font-medium transition-colors"
              style={activeTab === tab
                ? { color: "#0d9488", borderBottom: "2px solid #0d9488" }
                : { color: "#9ca3af" }}
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
            {/* Summary chips */}
            <div className="grid grid-cols-4 gap-4 mb-6">
              <div className="bg-white rounded-xl p-5 shadow-sm">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Presupuesto</p>
                <p className="text-xl font-bold text-gray-900">{formatCOP(project.totalPresupuesto)}</p>
              </div>
              <div className="bg-white rounded-xl p-5 shadow-sm">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Comprometido</p>
                <p className="text-xl font-bold text-gray-900">{formatCOP(project.totalComprometido)}</p>
              </div>
              <div className="bg-white rounded-xl p-5 shadow-sm border-l-4" style={{ borderColor: "#0d9488" }}>
                <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: "#0d9488" }}>Pagado</p>
                <p className="text-xl font-bold" style={{ color: "#0d9488" }}>{formatCOP(project.totalPagado)}</p>
              </div>
              <div className={`bg-white rounded-xl p-5 shadow-sm ${project.totalPendiente > 0 ? "border-l-4 border-amber-400" : ""}`}>
                <p className={`text-xs font-semibold uppercase tracking-wide mb-2 ${project.totalPendiente > 0 ? "text-amber-600" : "text-gray-400"}`}>
                  Pendiente
                </p>
                <p className={`text-xl font-bold ${project.totalPendiente > 0 ? "text-amber-600" : "text-gray-900"}`}>
                  {formatCOP(project.totalPendiente)}
                </p>
              </div>
            </div>

            {/* Ledger table */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="w-8 px-3 py-3"></th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Estado</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Descripción</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Fecha</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Comprometido</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Pagado</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Pendiente</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Insumo</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {project.costItems.length === 0 && (
                    <tr>
                      <td colSpan={9} className="px-5 py-10 text-center text-gray-400 text-sm">
                        Sin ítems de presupuesto. Usa "+ Nuevo Ítem APU" para agregar actividades.
                      </td>
                    </tr>
                  )}

                  {project.costItems.map((item) => {
                    const apuResources = item.apuItem?.lines.flatMap((l) => l.resource ? [l.resource] : []) ?? [];
                    const pct = item.totalBudgeted > 0 ? Math.min((item.totalPaid / item.totalBudgeted) * 100, 100) : 0;

                    return (
                      <Fragment key={item.id}>
                        {/* APU Group header */}
                        <tr key={`group-${item.id}`} className="border-y border-gray-100 bg-gray-50">
                          <td colSpan={9} className="px-4 py-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <span className="font-mono text-xs font-bold bg-white border border-gray-200 px-2 py-0.5 rounded" style={{ color: "#0d9488" }}>
                                  {item.apuItem?.code ?? "—"}
                                </span>
                                <span className="font-semibold text-gray-800 text-sm">{item.description}</span>
                                <span className="text-xs bg-gray-200 text-gray-500 px-2 py-0.5 rounded-full font-semibold">
                                  {item.commitments.length} {item.commitments.length === 1 ? "registro" : "registros"}
                                </span>
                              </div>
                              <div className="flex items-center gap-6">
                                {/* Progress bar */}
                                <div className="w-48">
                                  <div className="flex justify-between text-xs text-gray-400 mb-1">
                                    <span>Pagado vs presupuesto</span>
                                    <span className="font-semibold">{pct.toFixed(0)}%</span>
                                  </div>
                                  <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                                    <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: "#0d9488" }} />
                                  </div>
                                </div>
                                <span className="text-xs text-gray-400 tabular-nums">
                                  Ppto: <span className="font-semibold text-gray-600">{formatCOP(item.totalBudgeted)}</span>
                                </span>
                                {/* Add commitment button */}
                                <button
                                  onClick={() => setAddCommitmentTo(item)}
                                  className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg text-white transition-colors"
                                  style={{ backgroundColor: "#0d9488" }}
                                >
                                  <IconPlus /> Agregar
                                </button>
                                {/* Delete APU item */}
                                <button
                                  onClick={() => handleRemoveItem(item.id)}
                                  className="text-gray-300 hover:text-red-400 transition-colors"
                                  title="Eliminar ítem APU"
                                >
                                  <IconTrash />
                                </button>
                              </div>
                            </div>
                          </td>
                        </tr>

                        {/* Empty state for this group */}
                        {item.commitments.length === 0 && (
                          <tr key={`empty-${item.id}`} className="border-b border-gray-50">
                            <td colSpan={9} className="px-8 py-4 text-xs text-gray-400 italic">
                              Sin registros. Usa "Agregar" para registrar el primer gasto.
                            </td>
                          </tr>
                        )}

                        {/* Commitment rows */}
                        {item.commitments.map((c) => {
                          const isExpanded = expandedCommitments.has(c.id);
                          const showExpand = c.status !== "Pagado" || c.payments.length > 1;

                          return (
                            <Fragment key={c.id}>
                              <tr className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                                {/* Expand toggle */}
                                <td className="px-3 py-3 text-center">
                                  {(showExpand && c.payments.length > 0) && (
                                    <button
                                      onClick={() => toggleCommitment(c.id)}
                                      className="text-gray-400 hover:text-teal-600 transition-colors"
                                    >
                                      {isExpanded ? <IconChevronDown /> : <IconChevronRight />}
                                    </button>
                                  )}
                                </td>
                                {/* Status badge */}
                                <td className="px-4 py-3">
                                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-tight ${STATUS_BADGE_COMMITMENT[c.status]}`}>
                                    {c.status}
                                  </span>
                                </td>
                                {/* Description + notes */}
                                <td className="px-4 py-3">
                                  <p className="font-semibold text-gray-800 text-sm">{c.description}</p>
                                  {c.notes && <p className="text-xs text-gray-400 mt-0.5">{c.notes}</p>}
                                </td>
                                {/* Date */}
                                <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                                  {formatDate(c.date)}
                                </td>
                                {/* Amounts */}
                                <td className="px-4 py-3 text-right text-sm text-gray-700 tabular-nums">
                                  {formatCOP(c.totalCommitted)}
                                </td>
                                <td className="px-4 py-3 text-right text-sm font-semibold tabular-nums" style={{ color: "#0d9488" }}>
                                  {formatCOP(c.totalPaid)}
                                </td>
                                <td className={`px-4 py-3 text-right text-sm font-semibold tabular-nums ${c.totalPending > 0 ? "text-amber-600" : "text-gray-400"}`}>
                                  {formatCOP(c.totalPending)}
                                </td>
                                {/* Resource tag */}
                                <td className="px-4 py-3 text-center">
                                  {c.resource ? (
                                    <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: "#f0fdfa", color: "#0d9488" }}>
                                      {c.resource.code}
                                    </span>
                                  ) : (
                                    <span className="text-xs text-gray-300">—</span>
                                  )}
                                </td>
                                {/* Actions */}
                                <td className="px-4 py-3">
                                  <div className="flex items-center justify-end gap-1">
                                    {c.status !== "Pagado" && (
                                      <button
                                        onClick={() => setAddPaymentTo(c)}
                                        className="text-xs font-semibold px-2 py-1 rounded border text-gray-500 border-gray-200 hover:border-teal-500 hover:text-teal-600 transition-colors whitespace-nowrap"
                                        title="Agregar abono"
                                      >
                                        + Abonar
                                      </button>
                                    )}
                                    <button
                                      onClick={() => handleRemoveCommitment(c.id)}
                                      className="text-gray-300 hover:text-red-400 transition-colors ml-1"
                                      title="Eliminar"
                                    >
                                      <IconTrash />
                                    </button>
                                  </div>
                                </td>
                              </tr>

                              {/* Payment sub-rows */}
                              {isExpanded && c.payments.length > 0 && (
                                <tr key={`payments-${c.id}`} className="bg-gray-50 border-b border-gray-100">
                                  <td colSpan={9} className="pl-16 pr-6 py-3">
                                    <div className="border-l-2 border-teal-200 pl-4 space-y-2">
                                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Historial de abonos</p>
                                      {c.payments.map((p, idx) => (
                                        <div key={p.id} className="flex items-center justify-between bg-white border border-gray-100 rounded-lg px-4 py-2.5 shadow-sm">
                                          <div className="flex items-center gap-4">
                                            <div className="w-6 h-6 rounded-full bg-teal-50 flex items-center justify-center text-xs font-bold" style={{ color: "#0d9488" }}>
                                              {idx + 1}
                                            </div>
                                            <div>
                                              <p className="text-xs font-semibold text-gray-700">Abono #{idx + 1}</p>
                                              <p className="text-xs text-gray-400">{formatDate(p.date)}</p>
                                            </div>
                                            {p.notes && <p className="text-xs text-gray-400 italic">{p.notes}</p>}
                                          </div>
                                          <div className="flex items-center gap-3">
                                            <span className="text-sm font-bold text-gray-800 tabular-nums">{formatCOP(p.amount)}</span>
                                            <button
                                              onClick={() => handleRemovePayment(c.id, p.id)}
                                              className="text-gray-300 hover:text-red-400 transition-colors"
                                              title="Eliminar abono"
                                            >
                                              <IconX />
                                            </button>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </Fragment>
                          );
                        })}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>

              {/* Add APU item footer */}
              <button
                onClick={() => setShowAddItem(true)}
                className="w-full py-4 flex items-center justify-center gap-2 text-sm text-gray-400 hover:text-teal-600 border-t border-dashed border-gray-200 hover:bg-gray-50 transition-colors"
              >
                <IconPlus /> Agregar ítem APU
              </button>
            </div>

            {/* Footer legend */}
            <div className="flex items-center justify-end gap-4 mt-3 text-xs text-gray-400">
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-green-500 inline-block" /> Pagado</span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-400 inline-block" /> Parcial</span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-slate-300 inline-block" /> Pendiente</span>
            </div>
          </>
        )}
      </div>

      {/* Modals */}
      {showAddItem && (
        <AddAPUItemModal
          projectId={id}
          onClose={() => setShowAddItem(false)}
          onAdded={() => { setShowAddItem(false); load(); }}
        />
      )}

      {addCommitmentTo && (
        <CommitmentForm
          projectId={id}
          costItemId={addCommitmentTo.id}
          costItemDescription={addCommitmentTo.description}
          apuResources={addCommitmentTo.apuItem?.lines.flatMap((l) => l.resource ? [l.resource] : []) ?? []}
          onClose={() => setAddCommitmentTo(null)}
          onCreated={() => { setAddCommitmentTo(null); load(); }}
        />
      )}

      {addPaymentTo && (
        <PaymentForm
          projectId={id}
          commitment={addPaymentTo}
          onClose={() => setAddPaymentTo(null)}
          onCreated={() => { setAddPaymentTo(null); load(); }}
        />
      )}
    </div>
  );
}
