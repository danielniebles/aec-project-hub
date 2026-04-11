"use client";

import { useState } from "react";
import { formatCOP } from "@/lib/format";

type Resource = {
  id: string;
  code: string;
  description: string;
  unit: string;
};

interface Props {
  projectId: string;
  costItemId: string;
  costItemDescription: string;
  apuResources: Resource[];
  onClose: () => void;
  onCreated: () => void;
}

type Mode = "simple" | "commitment";

export default function CommitmentForm({ projectId, costItemId, costItemDescription, apuResources, onClose, onCreated }: Props) {
  const [mode, setMode] = useState<Mode>("simple");
  const [form, setForm] = useState({
    description: "",
    date: new Date().toISOString().slice(0, 10),
    totalCommitted: "",
    resourceId: "",
    notes: "",
  });
  const [saving, setSaving] = useState(false);

  function set(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.description || !form.date || !form.totalCommitted) return;
    setSaving(true);
    await fetch(`/api/projects/${projectId}/commitments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        costItemId,
        resourceId: form.resourceId || null,
        description: form.description,
        date: form.date,
        totalCommitted: parseFloat(form.totalCommitted),
        notes: form.notes || null,
        fullyPaid: mode === "simple",
        paidDate: form.date,
      }),
    });
    setSaving(false);
    onCreated();
  }

  const amount = parseFloat(form.totalCommitted) || 0;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100">
          <p className="text-xs text-gray-400 mb-0.5">{costItemDescription}</p>
          <h2 className="text-lg font-bold text-gray-900">Registrar gasto</h2>
        </div>

        {/* Mode toggle */}
        <div className="px-6 pt-5">
          <div className="flex rounded-lg border border-gray-200 overflow-hidden text-sm font-medium">
            <button
              type="button"
              onClick={() => setMode("simple")}
              className={`flex-1 py-2 transition-colors ${mode === "simple" ? "text-white bg-primary" : "text-gray-500 hover:bg-gray-50"}`}
            >
              Gasto simple
            </button>
            <button
              type="button"
              onClick={() => setMode("commitment")}
              className={`flex-1 py-2 border-l border-gray-200 transition-colors ${mode === "commitment" ? "text-white bg-primary" : "text-gray-500 hover:bg-gray-50"}`}
            >
              Compromiso
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-2 mb-4">
            {mode === "simple"
              ? "Pago realizado en su totalidad. Se registra como pagado."
              : "Acuerdo con proveedor. Puedes agregar abonos parciales después."}
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="px-6 space-y-4">
            {/* Description */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                Descripción <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
                placeholder='Ej. "Compra cemento Argos", "Contrato Movimiento Tierras"'
                required
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
              />
            </div>

            {/* Date + Amount row */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                  Fecha <span className="text-red-400">*</span>
                </label>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => set("date", e.target.value)}
                  required
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                  {mode === "simple" ? "Total pagado" : "Total comprometido"} <span className="text-red-400">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.totalCommitted}
                  onChange={(e) => set("totalCommitted", e.target.value)}
                  placeholder="0"
                  required
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            {/* Resource mapping */}
            {apuResources.length > 0 && (
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                  Insumo APU <span className="text-gray-300">(opcional)</span>
                </label>
                <select
                  value={form.resourceId}
                  onChange={(e) => set("resourceId", e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary text-gray-700"
                >
                  <option value="">Sin mapear</option>
                  {apuResources.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.code} — {r.description}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Notes (commitment mode only) */}
            {mode === "commitment" && (
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                  Referencia / Notas <span className="text-gray-300">(opcional)</span>
                </label>
                <input
                  type="text"
                  value={form.notes}
                  onChange={(e) => set("notes", e.target.value)}
                  placeholder='Ej. "Contrato #CT-004", "Factura pendiente"'
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
                />
              </div>
            )}

            {/* Amount preview */}
            {amount > 0 && (
              <div className="rounded-lg px-4 py-3 text-sm bg-primary/10">
                <span className="text-gray-500">
                  {mode === "simple" ? "Total a registrar:" : "Total comprometido:"}
                </span>
                <span className="float-right font-bold text-primary">
                  {formatCOP(amount)}
                </span>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-5 mt-4 flex gap-3 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2 rounded-lg text-sm font-semibold text-white transition-colors disabled:opacity-50 bg-primary"
            >
              {saving ? "Guardando..." : mode === "simple" ? "Registrar gasto" : "Crear compromiso"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
