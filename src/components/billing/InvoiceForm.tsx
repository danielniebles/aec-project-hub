"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Calendar } from "lucide-react";
import Link from "next/link";
import { computeDueDate } from "@/lib/billing";
import { formatCOP } from "@/lib/format";

type Client = {
  id: string;
  name: string;
  paymentTermType: string;
  fixedDay: number | null;
  email: string | null;
};

type Project = {
  id: string;
  name: string;
  code: string;
  clientId: string | null;
  client: Client | null;
  purchaseOrders: { id: string; number: string }[];
};

type PO = { id: string; number: string };

export default function InvoiceForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const prefilledProjectId = searchParams.get("projectId");

  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [pos, setPos] = useState<PO[]>([]);

  const [clientId, setClientId] = useState("");
  const [projectId, setProjectId] = useState(prefilledProjectId ?? "");
  const [purchaseOrderId, setPurchaseOrderId] = useState("");
  const [number, setNumber] = useState("");
  const [issueDate, setIssueDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [subtotal, setSubtotal] = useState("");
  const [taxPct, setTaxPct] = useState("19");
  const [description, setDescription] = useState("");
  const [notes, setNotes] = useState("");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Load clients
  useEffect(() => {
    fetch("/api/clients")
      .then((r) => r.json())
      .then(setClients);
  }, []);

  // Load projects when client is selected
  const loadProjects = useCallback(async (cid: string) => {
    if (!cid) { setProjects([]); return; }
    const res = await fetch(`/api/projects?clientId=${cid}`);
    const data = await res.json();
    setProjects(data.projects ?? data);
  }, []);

  // Load POs when project is selected
  const loadPOs = useCallback(async (pid: string) => {
    if (!pid) { setPos([]); return; }
    const res = await fetch(`/api/projects/${pid}/purchase-orders`);
    const data = await res.json();
    setPos(data);
  }, []);

  // If projectId is prefilled, load project details to set clientId
  useEffect(() => {
    if (!prefilledProjectId) return;
    fetch(`/api/projects/${prefilledProjectId}`)
      .then((r) => r.json())
      .then((p: Project) => {
        if (p.clientId) setClientId(p.clientId);
        loadPOs(prefilledProjectId);
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefilledProjectId]);

  useEffect(() => {
    if (clientId) loadProjects(clientId);
  }, [clientId, loadProjects]);

  useEffect(() => {
    if (projectId) loadPOs(projectId);
  }, [projectId, loadPOs]);

  // Compute due date preview
  const selectedClient = clients.find((c) => c.id === clientId);
  const computedDueDate = selectedClient && issueDate
    ? computeDueDate(new Date(issueDate), selectedClient)
    : null;

  const subtotalNum = Number(subtotal) || 0;
  const taxPctNum = Number(taxPct) || 0;
  const taxAmount = subtotalNum * (taxPctNum / 100);
  const total = subtotalNum + taxAmount;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const res = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          number,
          clientId,
          projectId,
          purchaseOrderId: purchaseOrderId || undefined,
          issueDate,
          subtotal: subtotalNum,
          taxPct: taxPctNum,
          description,
          notes,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error al guardar");
      router.push(projectId ? `/proyectos/${projectId}` : "/facturas");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-auto px-8 py-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-400 mb-4">
          <Link href="/facturas" className="hover:text-teal-600">Facturas</Link>
          <span>›</span>
          <span className="text-gray-600">Nueva factura</span>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-6 font-display">Nueva factura</h1>

        <form onSubmit={handleSubmit} className="max-w-2xl space-y-5">
          {/* Client + Project */}
          <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">
            <h2 className="text-sm font-semibold text-gray-700 mb-1">Destinatario</h2>

            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Cliente</label>
              <select
                value={clientId}
                onChange={(e) => { setClientId(e.target.value); setProjectId(""); }}
                required
                className="w-full mt-1 border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-teal-500"
              >
                <option value="">Seleccionar cliente...</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Proyecto</label>
              <select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                required
                disabled={!clientId && !prefilledProjectId}
                className="w-full mt-1 border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-teal-500 disabled:bg-gray-50"
              >
                <option value="">Seleccionar proyecto...</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>{p.name} ({p.code})</option>
                ))}
              </select>
            </div>

            {pos.length > 0 && (
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Orden de compra (opcional)</label>
                <select
                  value={purchaseOrderId}
                  onChange={(e) => setPurchaseOrderId(e.target.value)}
                  className="w-full mt-1 border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-teal-500"
                >
                  <option value="">Sin OC asociada</option>
                  {pos.map((po) => (
                    <option key={po.id} value={po.id}>{po.number}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Invoice details */}
          <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">
            <h2 className="text-sm font-semibold text-gray-700 mb-1">Datos de la factura</h2>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  N° Factura <span className="normal-case font-normal text-gray-400">(del sistema contable)</span>
                </label>
                <input
                  value={number}
                  onChange={(e) => setNumber(e.target.value)}
                  placeholder="FV-2024-0001"
                  required
                  className="w-full mt-1 border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-teal-500"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Fecha de emisión</label>
                <input
                  type="date"
                  value={issueDate}
                  onChange={(e) => setIssueDate(e.target.value)}
                  required
                  className="w-full mt-1 border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-teal-500"
                />
              </div>
            </div>

            {computedDueDate && (
              <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 rounded-lg text-xs text-amber-700">
                <Calendar size={16} className="shrink-0" />
                Fecha de vencimiento calculada: <strong>{computedDueDate.toLocaleDateString("es-CO", { day: "numeric", month: "long", year: "numeric" })}</strong>
              </div>
            )}

            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Concepto / Hito</label>
              <input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ej. Anticipo 30% — Fase de diseño"
                required
                className="w-full mt-1 border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-teal-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Subtotal (COP)</label>
                <input
                  type="number"
                  value={subtotal}
                  onChange={(e) => setSubtotal(e.target.value)}
                  placeholder="0"
                  min="0"
                  step="1"
                  required
                  className="w-full mt-1 border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-teal-500"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">IVA %</label>
                <input
                  type="number"
                  value={taxPct}
                  onChange={(e) => setTaxPct(e.target.value)}
                  min="0"
                  max="100"
                  step="0.1"
                  className="w-full mt-1 border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-teal-500"
                />
              </div>
            </div>

            {subtotalNum > 0 && (
              <div className="flex items-center justify-between px-4 py-3 bg-gray-50 rounded-lg text-sm">
                <div className="space-y-1">
                  <div className="flex justify-between gap-8">
                    <span className="text-gray-500">Subtotal</span>
                    <span className="text-gray-700">{formatCOP(subtotalNum)}</span>
                  </div>
                  <div className="flex justify-between gap-8">
                    <span className="text-gray-500">IVA {taxPct}%</span>
                    <span className="text-gray-700">{formatCOP(taxAmount)}</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-400 uppercase tracking-wide">Total</p>
                  <p className="text-xl font-bold text-gray-900">{formatCOP(total)}</p>
                </div>
              </div>
            )}

            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Notas (opcional)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                className="w-full mt-1 border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-teal-500 resize-none"
              />
            </div>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex gap-3">
            <Link
              href={projectId ? `/proyectos/${projectId}` : "/facturas"}
              className="px-5 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 rounded-lg text-sm font-medium text-white disabled:opacity-50"
              style={{ backgroundColor: "#0d9488" }}
            >
              {saving ? "Guardando..." : "Crear factura (borrador)"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
