"use client";

import { useState } from "react";

interface Props {
  onClose: () => void;
  onCreated: () => void;
}

const empty = { code: "", description: "", unit: "", type: "material", category: "", notes: "" };

export default function ResourceForm({ onClose, onCreated }: Props) {
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const res = await fetch("/api/resources", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (!res.ok) {
      const data = await res.json();
      setError(data.message ?? "Error al crear el insumo.");
      setSaving(false);
      return;
    }
    onCreated();
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-gray-800">Nuevo insumo</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 font-medium">Código *</label>
              <input
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
                placeholder="MT-0001"
                className="w-full border border-gray-200 rounded px-3 py-2 text-sm mt-1 focus:outline-none focus:border-teal-500"
                required
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 font-medium">Unidad *</label>
              <input
                value={form.unit}
                onChange={(e) => setForm({ ...form, unit: e.target.value })}
                placeholder="m², kg, hr..."
                className="w-full border border-gray-200 rounded px-3 py-2 text-sm mt-1 focus:outline-none focus:border-teal-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-500 font-medium">Descripción *</label>
            <input
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Nombre completo del insumo"
              className="w-full border border-gray-200 rounded px-3 py-2 text-sm mt-1 focus:outline-none focus:border-teal-500"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 font-medium">Tipo *</label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="w-full border border-gray-200 rounded px-3 py-2 text-sm mt-1 focus:outline-none focus:border-teal-500"
              >
                {/* TODO: Must be configurable or extract to an enum */}
                <option value="material">Material</option>
                <option value="labor">Mano de obra</option>
                <option value="equipment">Equipo</option>
                <option value="transport">Transporte</option>
                <option value="subcontract">Subcontrato</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 font-medium">Categoría *</label>
              <input
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                placeholder="Plomería, Acabados..."
                className="w-full border border-gray-200 rounded px-3 py-2 text-sm mt-1 focus:outline-none focus:border-teal-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-500 font-medium">Notas</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={2}
              className="w-full border border-gray-200 rounded px-3 py-2 text-sm mt-1 focus:outline-none focus:border-teal-500 resize-none"
            />
          </div>

          {error && <p className="text-xs text-red-600">{error}</p>}

          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2.5 rounded text-sm font-medium text-white"
              style={{ backgroundColor: "#0d9488" }}
            >
              {saving ? "Guardando..." : "Crear insumo"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded text-sm font-medium border border-gray-200 text-gray-600"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
