"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import PageHeader from "@/components/layout/PageHeader";
import APULineTable from "@/components/apu/APULineTable";
import APUSummaryPanel from "@/components/apu/APUSummaryPanel";
import AddLineModal from "@/components/apu/AddLineModal";

export type ResourcePrice = { id: string; price: string; sourceType: string; sourceName: string; validFrom: string };
export type APULineResource = { id: string; code: string; description: string; unit: string; type: string; prices: ResourcePrice[] };
export type APULine = {
  id: string;
  resourceId: string;
  quantity: string;
  wasteFactorPct: string;
  order: number;
  resource: APULineResource;
};
export type APUItem = {
  id: string;
  code: string;
  description: string;
  outputUnit: string;
  category: string;
  aiuAdminPct: string;
  aiuContingencyPct: string;
  aiuProfitPct: string;
  lines: APULine[];
};

export default function APUDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [item, setItem] = useState<APUItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [aiu, setAiu] = useState({ admin: "10", contingency: "5", profit: "3" });
  const [saving, setSaving] = useState(false);
  const [showAddLine, setShowAddLine] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch(`/api/apu-items/${id}`);
    const data: APUItem = await res.json();
    setItem(data);
    setAiu({
      admin: data.aiuAdminPct,
      contingency: data.aiuContingencyPct,
      profit: data.aiuProfitPct,
    });
    setLoading(false);
  }, [id]);

  useEffect(() => { load(); }, [load]);

  async function handleSaveAIU() {
    if (!item) return;
    setSaving(true);
    await fetch(`/api/apu-items/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        description: item.description,
        outputUnit: item.outputUnit,
        category: item.category,
        aiuAdminPct: parseFloat(aiu.admin),
        aiuContingencyPct: parseFloat(aiu.contingency),
        aiuProfitPct: parseFloat(aiu.profit),
      }),
    });
    await load();
    setSaving(false);
  }

  async function handleRemoveLine(lineId: string) {
    await fetch(`/api/apu-items/${id}/lines?lineId=${lineId}`, { method: "DELETE" });
    await load();
  }

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-400 text-sm">Cargando...</div>;
  if (!item) return <div className="p-8 text-red-500">Plantilla no encontrada.</div>;

  return (
    <div className="flex flex-col h-full">
      <PageHeader title="The Architectural Ledger">
        <button
          onClick={handleSaveAIU}
          disabled={saving}
          className="flex items-center gap-1.5 px-4 py-1.5 rounded text-sm font-medium border border-gray-300 text-gray-700 hover:bg-gray-50"
        >
          ↺ Recalcular
        </button>
        <button
          onClick={handleSaveAIU}
          disabled={saving}
          className="flex items-center gap-1.5 px-4 py-1.5 rounded text-sm font-medium text-white bg-primary"
        >
          {saving ? "Guardando..." : "💾 Guardar Plantilla"}
        </button>
      </PageHeader>

      <div className="flex flex-1 overflow-hidden">
        {/* Main content */}
        <div className="flex-1 overflow-auto p-6">
          {/* Breadcrumb + title */}
          <div className="mb-5">
            <div className="flex items-center gap-2 text-sm mb-2">
              <span className="bg-primary/10 text-primary font-mono font-semibold px-2 py-0.5 rounded text-xs">
                {item.code}
              </span>
              <span className="text-gray-400">•</span>
              <span className="text-gray-500">{item.category}</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 font-display">{item.description}</h1>
            <p className="text-gray-500 text-sm mt-1">
              Unidad de salida: <span className="font-medium text-gray-700">{item.outputUnit}</span>
            </p>
          </div>

          {/* Resource lines table */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-4">
            <APULineTable lines={item.lines} onRemove={handleRemoveLine} />
            <div className="px-5 py-3 border-t border-gray-100">
              <button
                onClick={() => setShowAddLine(true)}
                className="text-sm text-primary hover:text-primary font-medium flex items-center gap-1"
              >
                <span>+</span> Agregar insumo
              </button>
            </div>
          </div>

          {/* AIU inputs */}
          <div className="bg-white rounded-lg shadow-sm p-5">
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: "ADMINISTRACIÓN (%)", key: "admin" as const },
                { label: "IMPREVISTOS (%)", key: "contingency" as const },
                { label: "UTILIDAD (%)", key: "profit" as const },
              ].map(({ label, key }) => (
                <div key={key}>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-2">
                    {label}
                  </label>
                  <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                    <input
                      type="number" step="0.5" min="0"
                      value={aiu[key]}
                      onChange={(e) => setAiu((a) => ({ ...a, [key]: e.target.value }))}
                      className="flex-1 px-4 py-3 text-lg font-medium focus:outline-none"
                    />
                    <span className="px-3 text-gray-400 font-medium bg-gray-50 border-l border-gray-200 py-3">%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4">
            <Link href="/plantillas-apu" className="text-sm text-gray-400 hover:text-gray-600">
              ← Volver a plantillas
            </Link>
          </div>
        </div>

        {/* Summary panel */}
        <APUSummaryPanel item={item} aiu={aiu} />
      </div>

      {showAddLine && (
        <AddLineModal
          apuItemId={id}
          existingLineCount={item.lines.length}
          onClose={() => setShowAddLine(false)}
          onAdded={() => { setShowAddLine(false); load(); }}
        />
      )}
    </div>
  );
}
