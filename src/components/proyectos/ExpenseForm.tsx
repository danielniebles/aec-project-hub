"use client";

import { useState } from "react";
import { formatCOP } from "@/lib/format";

type Resource = { id: string; code: string; description: string; unit: string };

interface Props {
  projectId: string;
  costItemId: string;
  apuResources: Resource[];
  onClose: () => void;
  onCreated: () => void;
}

const empty = {
  description: "",
  date: new Date().toISOString().split("T")[0],
  total: "",
  resourceId: "",
  quantity: "",
  unit: "",
  unitCost: "",
  notes: "",
};

export default function ExpenseForm({ projectId, costItemId, apuResources, onClose, onCreated }: Props) {
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);

  function set(field: string, value: string) {
    setForm((f) => {
      const updated = { ...f, [field]: value };
      // Auto-compute total when quantity + unitCost are both filled
      if ((field === "quantity" || field === "unitCost") && updated.quantity && updated.unitCost) {
        updated.total = (parseFloat(updated.quantity) * parseFloat(updated.unitCost)).toFixed(0);
      }
      return updated;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.total || parseFloat(form.total) <= 0) return;
    setSaving(true);
    await fetch(`/api/projects/${projectId}/cost-items/${costItemId}/expenses`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        resourceId: form.resourceId || null,
        quantity: form.quantity || null,
        unitCost: form.unitCost || null,
      }),
    });
    setSaving(false);
    onCreated();
  }

  const selectedResource = apuResources.find((r) => r.id === form.resourceId);

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100">
          <h2 className="text-base font-bold text-gray-900">Agregar gasto de ejecución</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          {/* Description — free text, primary field */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Descripción *</label>
            <input
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="Ej. MANO DE OBRA ARMANDO, FERREMAX MATERIALES..."
              className="w-full mt-1 border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-teal-500"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Fecha *</label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => set("date", e.target.value)}
                className="w-full mt-1 border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-teal-500"
                required
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Total (COP) *</label>
              <input
                type="number"
                value={form.total}
                onChange={(e) => set("total", e.target.value)}
                placeholder="0"
                className="w-full mt-1 border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-teal-500"
                required
              />
            </div>
          </div>

          {/* Optional quantity breakdown */}
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-xs text-gray-400">Cantidad</label>
              <input
                type="number" step="0.001"
                value={form.quantity}
                onChange={(e) => set("quantity", e.target.value)}
                placeholder="—"
                className="w-full mt-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-teal-500"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400">Unidad</label>
              <input
                value={form.unit}
                onChange={(e) => set("unit", e.target.value)}
                placeholder="m², kg..."
                className="w-full mt-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-teal-500"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400">Precio unit.</label>
              <input
                type="number"
                value={form.unitCost}
                onChange={(e) => set("unitCost", e.target.value)}
                placeholder="—"
                className="w-full mt-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-teal-500"
              />
            </div>
          </div>

          {/* Optional resource mapping */}
          {apuResources.length > 0 && (
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Insumo del APU <span className="font-normal text-gray-400">(opcional)</span>
              </label>
              <select
                value={form.resourceId}
                onChange={(e) => set("resourceId", e.target.value)}
                className="w-full mt-1 border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-teal-500"
              >
                <option value="">Sin mapear</option>
                {apuResources.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.code} — {r.description} ({r.unit})
                  </option>
                ))}
              </select>
              {selectedResource && (
                <p className="text-xs text-teal-600 mt-1">
                  Este gasto se contabilizará como consumo de "{selectedResource.description}"
                </p>
              )}
            </div>
          )}

          {form.total && parseFloat(form.total) > 0 && (
            <div className="bg-teal-50 rounded-lg px-4 py-3 text-sm text-teal-800 font-medium">
              Total a registrar: {formatCOP(parseFloat(form.total))}
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-40"
              style={{ backgroundColor: "#0d9488" }}
            >
              {saving ? "Guardando..." : "Registrar gasto"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium border border-gray-200 text-gray-600"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
