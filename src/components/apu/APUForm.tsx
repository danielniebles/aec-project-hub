"use client";

import { useState } from "react";
import { X } from "lucide-react";

interface Props {
  onClose: () => void;
  onCreated: () => void;
}

const empty = {
  code: "",
  description: "",
  outputUnit: "",
  category: "",
  aiuAdminPct: "10",
  aiuContingencyPct: "5",
  aiuProfitPct: "3",
  notes: "",
};

export default function APUForm({ onClose, onCreated }: Props) {
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const res = await fetch("/api/apu-items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        aiuAdminPct: parseFloat(form.aiuAdminPct),
        aiuContingencyPct: parseFloat(form.aiuContingencyPct),
        aiuProfitPct: parseFloat(form.aiuProfitPct),
      }),
    });
    if (!res.ok) {
      setError("Error al crear la plantilla.");
      setSaving(false);
      return;
    }
    onCreated();
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-gray-800">Nueva plantilla APU</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 font-medium">Código *</label>
              <input value={form.code} onChange={(e) => set("code", e.target.value)}
                placeholder="APU-PLO-001"
                className="w-full border border-gray-200 rounded px-3 py-2 text-sm mt-1 focus:outline-none focus:border-teal-500"
                required />
            </div>
            <div>
              <label className="text-xs text-gray-500 font-medium">Unidad de salida *</label>
              <input value={form.outputUnit} onChange={(e) => set("outputUnit", e.target.value)}
                placeholder="Unidad, m², ml..."
                className="w-full border border-gray-200 rounded px-3 py-2 text-sm mt-1 focus:outline-none focus:border-teal-500"
                required />
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-500 font-medium">Descripción *</label>
            <input value={form.description} onChange={(e) => set("description", e.target.value)}
              placeholder="Nombre de la actividad APU"
              className="w-full border border-gray-200 rounded px-3 py-2 text-sm mt-1 focus:outline-none focus:border-teal-500"
              required />
          </div>

          <div>
            <label className="text-xs text-gray-500 font-medium">Categoría *</label>
            <input value={form.category} onChange={(e) => set("category", e.target.value)}
              placeholder="Ej. Instalaciones Hidráulicas"
              className="w-full border border-gray-200 rounded px-3 py-2 text-sm mt-1 focus:outline-none focus:border-teal-500"
              required />
          </div>

          <div>
            <label className="text-xs text-gray-500 font-medium block mb-1">AIU (%)</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: "Administración", field: "aiuAdminPct" },
                { label: "Imprevistos", field: "aiuContingencyPct" },
                { label: "Utilidad", field: "aiuProfitPct" },
              ].map(({ label, field }) => (
                <div key={field}>
                  <label className="text-xs text-gray-400">{label}</label>
                  <div className="flex items-center border border-gray-200 rounded mt-0.5 overflow-hidden">
                    <input
                      type="number" step="0.5" min="0"
                      value={form[field as keyof typeof form]}
                      onChange={(e) => set(field, e.target.value)}
                      className="w-full px-2 py-1.5 text-sm focus:outline-none"
                    />
                    <span className="px-2 text-gray-400 text-sm bg-gray-50 border-l border-gray-200">%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {error && <p className="text-xs text-red-600">{error}</p>}

          <div className="flex gap-2 pt-2">
            <button type="submit" disabled={saving}
              className="flex-1 py-2.5 rounded text-sm font-medium text-white"
              style={{ backgroundColor: "#0d9488" }}>
              {saving ? "Guardando..." : "Crear plantilla"}
            </button>
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded text-sm font-medium border border-gray-200 text-gray-600">
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
