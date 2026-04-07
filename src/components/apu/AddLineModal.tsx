"use client";

import { useEffect, useState } from "react";
import { formatCOP } from "@/lib/format";

type Resource = {
  id: string;
  code: string;
  description: string;
  unit: string;
  type: string;
  prices: { price: string; sourceName: string }[];
};

interface Props {
  apuItemId: string;
  existingLineCount: number;
  onClose: () => void;
  onAdded: () => void;
}

export default function AddLineModal({ apuItemId, existingLineCount, onClose, onAdded }: Props) {
  const [resources, setResources] = useState<Resource[]>([]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Resource | null>(null);
  const [quantity, setQuantity] = useState("1");
  const [wastePct, setWastePct] = useState("0");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchResources = async () => {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      const res = await fetch(`/api/resources?${params}`);
      setResources(await res.json());
    };
    fetchResources();
  }, [search]);

  async function handleAdd() {
    if (!selected) return;
    setSaving(true);
    await fetch(`/api/apu-items/${apuItemId}/lines`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        resourceId: selected.id,
        quantity: parseFloat(quantity),
        wasteFactorPct: parseFloat(wastePct),
        order: existingLineCount,
      }),
    });
    setSaving(false);
    onAdded();
  }

  const TYPE_LABELS: Record<string, string> = {
    material: "Material", labor: "Mano de Obra", equipment: "Equipo",
    transport: "Transporte", subcontract: "Subcontrato",
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg flex flex-col max-h-[80vh]">
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-200">
          <h2 className="text-base font-semibold text-gray-800">Agregar insumo a APU</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
        </div>

        {/* Resource search */}
        <div className="px-6 pt-4">
          <input
            type="text"
            placeholder="Buscar insumo por nombre o código..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setSelected(null); }}
            className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-teal-500"
          />
        </div>

        {/* Resource list */}
        <div className="flex-1 overflow-auto px-6 py-2">
          {resources.length === 0 && (
            <p className="text-center text-gray-400 text-sm py-6">Sin resultados</p>
          )}
          {resources.map((r) => {
            const price = r.prices[0];
            const isSelected = selected?.id === r.id;
            return (
              <div
                key={r.id}
                onClick={() => setSelected(r)}
                className="flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer transition-colors mb-1"
                style={isSelected ? { backgroundColor: "#f0fdfa", border: "1px solid #0d9488" } : { border: "1px solid transparent" }}
              >
                <div>
                  <p className="text-sm font-medium text-gray-800">{r.description}</p>
                  <p className="text-xs text-gray-400">{r.code} · {r.unit} · {TYPE_LABELS[r.type] ?? r.type}</p>
                </div>
                <div className="text-right">
                  {price
                    ? <p className="text-sm font-medium text-gray-700">{formatCOP(price.price)}</p>
                    : <p className="text-xs text-red-400">Sin precio</p>
                  }
                  {price && <p className="text-xs text-gray-400">{price.sourceName}</p>}
                </div>
              </div>
            );
          })}
        </div>

        {/* Quantity + waste inputs */}
        {selected && (
          <div className="px-6 pb-4 border-t border-gray-100 pt-4">
            <p className="text-xs font-semibold text-gray-500 mb-3">
              Insumo seleccionado: <span className="text-teal-600">{selected.description}</span>
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-500 font-medium">Cantidad *</label>
                <input
                  type="number" step="0.001" min="0"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="w-full border border-gray-200 rounded px-3 py-2 text-sm mt-1 focus:outline-none focus:border-teal-500"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 font-medium">Desperdicio (%)</label>
                <input
                  type="number" step="0.5" min="0"
                  value={wastePct}
                  onChange={(e) => setWastePct(e.target.value)}
                  className="w-full border border-gray-200 rounded px-3 py-2 text-sm mt-1 focus:outline-none focus:border-teal-500"
                />
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-2 px-6 pb-5">
          <button
            onClick={handleAdd}
            disabled={!selected || saving}
            className="flex-1 py-2.5 rounded text-sm font-medium text-white disabled:opacity-40"
            style={{ backgroundColor: "#0d9488" }}
          >
            {saving ? "Agregando..." : "Agregar insumo"}
          </button>
          <button onClick={onClose}
            className="flex-1 py-2.5 rounded text-sm font-medium border border-gray-200 text-gray-600">
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
