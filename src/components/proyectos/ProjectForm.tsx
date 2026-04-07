"use client";

import { useState } from "react";
import { STATUS_LABEL, TYPE_LABEL } from "@/lib/projectStatus";

interface Props {
  onClose: () => void;
  onCreated: () => void;
}

const empty = {
  name: "", code: "", type: "construction", status: "prospect",
  location: "", startDate: "", endDate: "", notes: "",
};

export default function ProjectForm({ onClose, onCreated }: Props) {
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
    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (!res.ok) { setError("Error al crear el proyecto."); setSaving(false); return; }
    onCreated();
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl">
        <div className="px-7 pt-6 pb-4">
          <div className="flex items-start justify-between mb-1">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Nuevo proyecto</h2>
              <p className="text-sm text-gray-400 mt-0.5">Ingrese los detalles técnicos para iniciar el presupuesto.</p>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none mt-1">×</button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="px-7 pb-0 space-y-4">
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Nombre del proyecto</label>
            <input value={form.name} onChange={(e) => set("name", e.target.value)}
              placeholder="Ej. Centro Comercial El Dorado - Fase II"
              className="w-full mt-1 border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-teal-500"
              required />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Código</label>
              <input value={form.code} onChange={(e) => set("code", e.target.value)}
                placeholder="PRJ-000"
                className="w-full mt-1 border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-teal-500"
                required />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Tipo de obra</label>
              <select value={form.type} onChange={(e) => set("type", e.target.value)}
                className="w-full mt-1 border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-teal-500">
                {Object.entries(TYPE_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Estado inicial</label>
              <select value={form.status} onChange={(e) => set("status", e.target.value)}
                className="w-full mt-1 border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-teal-500">
                {Object.entries(STATUS_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Ubicación (ciudad/dpto)</label>
              <input value={form.location} onChange={(e) => set("location", e.target.value)}
                placeholder="Ej. Bogotá, D.C."
                className="w-full mt-1 border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-teal-500" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Fecha estimada inicio</label>
              <input type="date" value={form.startDate} onChange={(e) => set("startDate", e.target.value)}
                className="w-full mt-1 border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-teal-500" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Fecha estimada fin</label>
              <input type="date" value={form.endDate} onChange={(e) => set("endDate", e.target.value)}
                className="w-full mt-1 border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-teal-500" />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Notas y descripción del proyecto</label>
            <textarea value={form.notes} onChange={(e) => set("notes", e.target.value)}
              rows={3}
              placeholder="Detalles adicionales sobre el alcance, cliente o requisitos especiales..."
              className="w-full mt-1 border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-teal-500 resize-none" />
          </div>

          {error && <p className="text-xs text-red-600">{error}</p>}
        </form>

        <div className="flex items-center justify-end gap-3 px-7 py-5 bg-gray-50 rounded-b-2xl mt-4">
          <button onClick={onClose} className="px-5 py-2.5 text-sm font-medium text-gray-600 hover:text-gray-800">
            Cancelar
          </button>
          <button onClick={handleSubmit as never} disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium text-white disabled:opacity-50"
            style={{ backgroundColor: "#0d9488" }}>
            🚀 {saving ? "Creando..." : "Crear proyecto"}
          </button>
        </div>
      </div>
    </div>
  );
}
