"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { formatCOP } from "@/lib/format";
import { computeAPUUnitPrice } from "@/lib/apuCalc";

// ── APU tab types ─────────────────────────────────────────────────────────────

type APUItem = {
  id: string;
  code: string;
  description: string;
  outputUnit: string;
  category: string;
  lines: {
    resource: { prices: { price: string }[] };
    quantity: string;
    wasteFactorPct: string;
  }[];
  aiuAdminPct: string;
  aiuContingencyPct: string;
  aiuProfitPct: string;
};

// ── Resource tab types ────────────────────────────────────────────────────────

type Resource = {
  id: string;
  code: string;
  description: string;
  unit: string;
  type: string;
  prices: { price: string }[];
};

// ── Shared ────────────────────────────────────────────────────────────────────

type Tab = "apu" | "resource" | "manual";

const COST_CATEGORIES = [
  { value: "labor", label: "Mano de obra" },
  { value: "materials", label: "Materiales" },
  { value: "equipment", label: "Equipos" },
  { value: "subcontractor", label: "Subcontratista" },
  { value: "design_fees", label: "Honorarios" },
  { value: "admin_permits", label: "Admin / Permisos" },
  { value: "transport", label: "Transporte" },
  { value: "other", label: "Otro" },
];

interface Props {
  projectId: string;
  onClose: () => void;
  onAdded: () => void;
}

export default function AddCostItemModal({ projectId, onClose, onAdded }: Props) {
  const [tab, setTab] = useState<Tab>("apu");

  // APU tab state
  const [apuItems, setApuItems] = useState<APUItem[]>([]);
  const [selectedAPU, setSelectedAPU] = useState<APUItem | null>(null);
  const [apuQty, setApuQty] = useState("1");

  // Resource tab state
  const [resourceSearch, setResourceSearch] = useState("");
  const [resources, setResources] = useState<Resource[]>([]);
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);
  const [resourceQty, setResourceQty] = useState("1");

  // Manual tab state
  const [manualForm, setManualForm] = useState({
    description: "",
    unit: "",
    category: "other",
    quantity: "1",
    unitCost: "0",
  });

  const [saving, setSaving] = useState(false);

  // Load APU items once
  useEffect(() => {
    fetch("/api/apu-items").then((r) => r.json()).then(setApuItems);
  }, []);

  // Debounced resource search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetch(`/api/resources?search=${encodeURIComponent(resourceSearch)}`)
        .then((r) => r.json())
        .then((data) => setResources(data.resources ?? data));
    }, 250);
    return () => clearTimeout(timer);
  }, [resourceSearch]);

  async function handleAdd() {
    setSaving(true);
    try {
      if (tab === "apu") {
        if (!selectedAPU) return;
        await fetch(`/api/projects/${projectId}/cost-items`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mode: "apu",
            apuItemId: selectedAPU.id,
            quantity: parseFloat(apuQty),
          }),
        });
      } else if (tab === "resource") {
        if (!selectedResource) return;
        await fetch(`/api/projects/${projectId}/cost-items`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mode: "resource",
            resourceId: selectedResource.id,
            quantity: parseFloat(resourceQty),
          }),
        });
      } else {
        if (!manualForm.description || !manualForm.unit) return;
        await fetch(`/api/projects/${projectId}/cost-items`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mode: "manual",
            description: manualForm.description,
            unit: manualForm.unit,
            category: manualForm.category,
            quantity: parseFloat(manualForm.quantity),
            unitCost: parseFloat(manualForm.unitCost),
          }),
        });
      }
      onAdded();
    } finally {
      setSaving(false);
    }
  }

  const canAdd =
    (tab === "apu" && !!selectedAPU) ||
    (tab === "resource" && !!selectedResource) ||
    (tab === "manual" && !!manualForm.description && !!manualForm.unit);

  const tabs: { key: Tab; label: string }[] = [
    { key: "apu", label: "APU" },
    { key: "resource", label: "Insumo directo" },
    { key: "manual", label: "Manual" },
  ];

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100">
          <h2 className="text-base font-bold text-gray-900">Agregar ítem al presupuesto</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>

        {/* Tab bar */}
        <div className="flex border-b border-gray-100 px-6">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`py-3 px-4 text-sm font-medium border-b-2 -mb-px transition-colors ${
                tab === t.key
                  ? "border-teal-500 text-teal-600"
                  : "border-transparent text-gray-400 hover:text-gray-600"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-auto">
          {/* ── APU tab ── */}
          {tab === "apu" && (
            <div className="px-6 py-4 space-y-2">
              {apuItems.map((item) => {
                const unitPrice = computeAPUUnitPrice(item);
                const isSelected = selectedAPU?.id === item.id;
                return (
                  <div
                    key={item.id}
                    onClick={() => setSelectedAPU(item)}
                    className="flex items-center justify-between px-4 py-3 rounded-xl cursor-pointer transition-all border"
                    style={
                      isSelected
                        ? { borderColor: "#0d9488", backgroundColor: "#f0fdfa" }
                        : { borderColor: "transparent", backgroundColor: "#f9fafb" }
                    }
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-teal-600 font-semibold">{item.code}</span>
                        <span className="text-xs text-gray-400">{item.category}</span>
                      </div>
                      <p className="text-sm font-medium text-gray-800 mt-0.5">{item.description}</p>
                      <p className="text-xs text-gray-400">{item.outputUnit}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-gray-800">{formatCOP(unitPrice)}</p>
                      <p className="text-xs text-gray-400">por {item.outputUnit}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ── Resource tab ── */}
          {tab === "resource" && (
            <div className="px-6 py-4">
              <input
                type="text"
                value={resourceSearch}
                onChange={(e) => setResourceSearch(e.target.value)}
                placeholder="Buscar insumo por nombre o código..."
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-teal-500 mb-3"
              />
              <div className="space-y-2">
                {resources.map((r) => {
                  const latestPrice = r.prices[0];
                  const isSelected = selectedResource?.id === r.id;
                  return (
                    <div
                      key={r.id}
                      onClick={() => setSelectedResource(r)}
                      className="flex items-center justify-between px-4 py-3 rounded-xl cursor-pointer transition-all border"
                      style={
                        isSelected
                          ? { borderColor: "#0d9488", backgroundColor: "#f0fdfa" }
                          : { borderColor: "transparent", backgroundColor: "#f9fafb" }
                      }
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-semibold" style={{ color: "#0369a1" }}>
                            {r.code}
                          </span>
                          <span className="text-xs text-gray-400">{r.unit}</span>
                        </div>
                        <p className="text-sm font-medium text-gray-800 mt-0.5">{r.description}</p>
                      </div>
                      <div className="text-right">
                        {latestPrice ? (
                          <>
                            <p className="text-sm font-bold text-gray-800">{formatCOP(Number(latestPrice.price))}</p>
                            <p className="text-xs text-gray-400">por {r.unit}</p>
                          </>
                        ) : (
                          <p className="text-xs text-gray-400">Sin precio</p>
                        )}
                      </div>
                    </div>
                  );
                })}
                {resources.length === 0 && (
                  <p className="text-sm text-gray-400 text-center py-6">
                    {resourceSearch ? "Sin resultados" : "Escribe para buscar insumos"}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* ── Manual tab ── */}
          {tab === "manual" && (
            <div className="px-6 py-4 space-y-4">
              <p className="text-xs text-gray-400">
                Ítem sin APU ni insumo asociado. Aparecerá en el grupo <span className="font-semibold text-gray-500">Varios</span> del presupuesto.
              </p>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                  Descripción <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={manualForm.description}
                  onChange={(e) => setManualForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder='Ej. "Limpieza general obra", "Señalización temporal"'
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-teal-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                    Unidad <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={manualForm.unit}
                    onChange={(e) => setManualForm((f) => ({ ...f, unit: e.target.value }))}
                    placeholder='Ej. "GL", "m²", "día"'
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                    Categoría
                  </label>
                  <select
                    value={manualForm.category}
                    onChange={(e) => setManualForm((f) => ({ ...f, category: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-teal-500 text-gray-700"
                  >
                    {COST_CATEGORIES.map((c) => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                    Cantidad
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={manualForm.quantity}
                    onChange={(e) => setManualForm((f) => ({ ...f, quantity: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                    Costo unitario
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={manualForm.unitCost}
                    onChange={(e) => setManualForm((f) => ({ ...f, unitCost: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>
              {parseFloat(manualForm.quantity) > 0 && parseFloat(manualForm.unitCost) > 0 && (
                <div className="rounded-lg px-4 py-3 text-sm" style={{ backgroundColor: "#f0fdfa" }}>
                  <span className="text-gray-500">Total presupuestado:</span>
                  <span className="float-right font-bold" style={{ color: "#0d9488" }}>
                    {formatCOP(parseFloat(manualForm.quantity) * parseFloat(manualForm.unitCost))}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Quantity row for APU / Resource tabs */}
        {tab === "apu" && selectedAPU && (
          <div className="px-6 py-4 border-t border-gray-100">
            <p className="text-xs text-gray-500 mb-2">
              <span className="font-semibold text-teal-600">{selectedAPU.description}</span>
              {" — precio unitario: "}
              {formatCOP(computeAPUUnitPrice(selectedAPU))}
            </p>
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <label className="text-xs text-gray-500 font-medium">
                  Cantidad ({selectedAPU.outputUnit})
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={apuQty}
                  onChange={(e) => setApuQty(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:border-teal-500"
                />
              </div>
              <div className="pt-5 text-sm text-gray-500">
                ={" "}
                <span className="font-bold text-gray-800">
                  {formatCOP(computeAPUUnitPrice(selectedAPU) * parseFloat(apuQty || "0"))}
                </span>
              </div>
            </div>
          </div>
        )}

        {tab === "resource" && selectedResource && (
          <div className="px-6 py-4 border-t border-gray-100">
            <p className="text-xs text-gray-500 mb-2">
              <span className="font-semibold" style={{ color: "#0369a1" }}>{selectedResource.description}</span>
              {selectedResource.prices[0]
                ? ` — ${formatCOP(Number(selectedResource.prices[0].price))} / ${selectedResource.unit}`
                : " — sin precio registrado"}
            </p>
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <label className="text-xs text-gray-500 font-medium">
                  Cantidad ({selectedResource.unit})
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={resourceQty}
                  onChange={(e) => setResourceQty(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:border-teal-500"
                />
              </div>
              {selectedResource.prices[0] && (
                <div className="pt-5 text-sm text-gray-500">
                  ={" "}
                  <span className="font-bold text-gray-800">
                    {formatCOP(
                      Number(selectedResource.prices[0].price) * parseFloat(resourceQty || "0")
                    )}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex gap-3 px-6 pb-5 pt-4 border-t border-gray-100">
          <button
            onClick={handleAdd}
            disabled={!canAdd || saving}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-40"
            style={{ backgroundColor: "#0d9488" }}
          >
            {saving ? "Agregando..." : "Agregar al presupuesto"}
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium border border-gray-200 text-gray-600"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
