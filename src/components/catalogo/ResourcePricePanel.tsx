"use client";

import { useState } from "react";
import { Resource } from "@/app/catalogo/page";
import { formatCOP, formatDate } from "@/lib/format";

const SOURCE_LABELS: Record<string, string> = {
  camacol: "CAMACOL",
  gobernacion: "GOBERNACIÓN",
  supplier: "PROVEEDOR",
  internal: "INTERNO",
  manual: "MANUAL",
};

const SOURCE_COLORS: Record<string, string> = {
  camacol: "bg-amber-600 text-white",
  gobernacion: "bg-green-700 text-white",
  supplier: "bg-orange-700 text-white",
  internal: "bg-gray-500 text-white",
  manual: "bg-gray-400 text-white",
};

interface Props {
  resource: Resource;
  onClose: () => void;
  onPriceAdded: () => void;
}

const emptyForm = {
  sourceType: "internal",
  sourceName: "",
  price: "",
  validFrom: new Date().toISOString().split("T")[0],
  validUntil: "",
  notes: "",
};

export default function ResourcePricePanel({ resource, onClose, onPriceAdded }: Props) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  async function handleAddPrice(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await fetch(`/api/resources/${resource.id}/prices`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        price: parseFloat(form.price),
        validUntil: form.validUntil || null,
      }),
    });
    setSaving(false);
    setShowAddForm(false);
    setForm(emptyForm);
    onPriceAdded();
  }

  const activeCount = resource.prices.filter((p) => !p.validUntil).length;

  return (
    <div className="w-80 border-l border-gray-200 bg-white flex flex-col h-full overflow-auto">
      {/* Header */}
      <div className="flex items-start justify-between px-5 pt-5 pb-3">
        <div>
          <h2 className="text-base font-semibold text-gray-800">Detalle de Precios</h2>
          <p className="text-teal-600 text-sm font-medium mt-0.5">{resource.description}</p>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-lg leading-none mt-1">×</button>
      </div>

      {/* Price history */}
      <div className="px-5 pb-3">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Historial de Fuentes</span>
          {activeCount > 0 && (
            <span className="text-xs bg-teal-50 text-teal-700 font-semibold px-2 py-0.5 rounded-full">{activeCount} Activas</span>
          )}
        </div>

        {resource.prices.length === 0 && (
          <p className="text-xs text-gray-400 py-4 text-center">Sin registros de precio aún.</p>
        )}

        <div className="space-y-3">
          {resource.prices.map((p) => (
            <div key={p.id} className="border border-gray-100 rounded-lg p-3">
              <div className="flex items-center justify-between mb-1">
                <span className={`text-xs font-bold px-2 py-0.5 rounded ${SOURCE_COLORS[p.sourceType] ?? "bg-gray-400 text-white"}`}>
                  {SOURCE_LABELS[p.sourceType] ?? p.sourceType.toUpperCase()}
                </span>
                <span className="text-sm font-bold text-gray-800">{formatCOP(p.price)}</span>
              </div>
              <p className="text-xs text-gray-600 mb-2">{p.sourceName}</p>
              <div className="flex gap-4 text-xs text-gray-400">
                <div>
                  <div className="font-medium text-gray-500">Desde</div>
                  <div>{formatDate(p.validFrom)}</div>
                </div>
                <div>
                  <div className="font-medium text-gray-500">Hasta</div>
                  <div>{p.validUntil ? formatDate(p.validUntil) : "Vigente"}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1" />

      {/* Add price form */}
      {showAddForm ? (
        <form onSubmit={handleAddPrice} className="border-t border-gray-200 p-4 space-y-3">
          <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Agregar precio</p>
          <div className="grid grid-cols-2 gap-2">
            <div className="col-span-2">
              <label className="text-xs text-gray-500">Fuente</label>
              <select
                value={form.sourceType}
                onChange={(e) => setForm({ ...form, sourceType: e.target.value })}
                className="w-full border border-gray-200 rounded px-2 py-1.5 text-sm mt-0.5"
                required
              >
                {/* TODO: This should be configurable or be an array */}
                <option value="internal">Interno</option>
                <option value="camacol">CAMACOL</option>
                <option value="gobernacion">Gobernación</option>
                <option value="supplier">Proveedor</option>
                <option value="manual">Manual</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="text-xs text-gray-500">Nombre de fuente</label>
              <input
                value={form.sourceName}
                onChange={(e) => setForm({ ...form, sourceName: e.target.value })}
                placeholder="Ej. CAMACOL Antioquia Nov 2023"
                className="w-full border border-gray-200 rounded px-2 py-1.5 text-sm mt-0.5"
                required
              />
            </div>
            <div className="col-span-2">
              <label className="text-xs text-gray-500">Precio (COP)</label>
              <input
                type="number"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                placeholder="0"
                className="w-full border border-gray-200 rounded px-2 py-1.5 text-sm mt-0.5"
                required
              />
            </div>
            <div>
              <label className="text-xs text-gray-500">Válido desde</label>
              <input
                type="date"
                value={form.validFrom}
                onChange={(e) => setForm({ ...form, validFrom: e.target.value })}
                className="w-full border border-gray-200 rounded px-2 py-1.5 text-sm mt-0.5"
                required
              />
            </div>
            <div>
              <label className="text-xs text-gray-500">Válido hasta</label>
              <input
                type="date"
                value={form.validUntil}
                onChange={(e) => setForm({ ...form, validUntil: e.target.value })}
                className="w-full border border-gray-200 rounded px-2 py-1.5 text-sm mt-0.5"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2 rounded text-sm font-medium text-white"
              style={{ backgroundColor: "#0d9488" }}
            >
              {saving ? "Guardando..." : "Guardar"}
            </button>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="flex-1 py-2 rounded text-sm font-medium border border-gray-200 text-gray-600"
            >
              Cancelar
            </button>
          </div>
        </form>
      ) : (
        <div className="border-t border-gray-200 p-4">
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center justify-center gap-2 w-full py-3 rounded text-sm font-medium text-white"
            style={{ backgroundColor: "#0d9488" }}
          >
            <span>+</span> Agregar precio
          </button>
        </div>
      )}
    </div>
  );
}
