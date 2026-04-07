"use client";

import { useEffect, useState } from "react";
import { formatCOP } from "@/lib/format";

type APUItem = {
  id: string;
  code: string;
  description: string;
  outputUnit: string;
  category: string;
  lines: { resource: { prices: { price: string }[] }; quantity: string; wasteFactorPct: string }[];
  aiuAdminPct: string;
  aiuContingencyPct: string;
  aiuProfitPct: string;
};

interface Props {
  projectId: string;
  onClose: () => void;
  onAdded: () => void;
}

function computeUnitPrice(item: APUItem): number {
  const direct = item.lines.reduce((sum, line) => {
    const price = line.resource.prices[0];
    if (!price) return sum;
    return sum + Number(price.price) * Number(line.quantity) * (1 + Number(line.wasteFactorPct) / 100);
  }, 0);
  const aiu = (Number(item.aiuAdminPct) + Number(item.aiuContingencyPct) + Number(item.aiuProfitPct)) / 100;
  return direct * (1 + aiu);
}

export default function AddAPUItemModal({ projectId, onClose, onAdded }: Props) {
  const [items, setItems] = useState<APUItem[]>([]);
  const [selected, setSelected] = useState<APUItem | null>(null);
  const [quantity, setQuantity] = useState("1");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/apu-items").then((r) => r.json()).then(setItems);
  }, []);

  async function handleAdd() {
    if (!selected) return;
    setSaving(true);
    await fetch(`/api/projects/${projectId}/cost-items`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ apuItemId: selected.id, quantity: parseFloat(quantity) }),
    });
    setSaving(false);
    onAdded();
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col max-h-[80vh]">
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100">
          <h2 className="text-base font-bold text-gray-900">Agregar ítem APU al presupuesto</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
        </div>

        <div className="flex-1 overflow-auto px-6 py-4 space-y-2">
          {items.map((item) => {
            const unitPrice = computeUnitPrice(item);
            const isSelected = selected?.id === item.id;
            return (
              <div
                key={item.id}
                onClick={() => setSelected(item)}
                className="flex items-center justify-between px-4 py-3 rounded-xl cursor-pointer transition-all border"
                style={isSelected
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

        {selected && (
          <div className="px-6 py-4 border-t border-gray-100">
            <p className="text-xs text-gray-500 mb-2">
              <span className="font-semibold text-teal-600">{selected.description}</span> — precio unitario: {formatCOP(computeUnitPrice(selected))}
            </p>
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <label className="text-xs text-gray-500 font-medium">Cantidad ({selected.outputUnit})</label>
                <input
                  type="number" step="0.01" min="0.01"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:border-teal-500"
                />
              </div>
              <div className="pt-5 text-sm text-gray-500">
                = <span className="font-bold text-gray-800">{formatCOP(computeUnitPrice(selected) * parseFloat(quantity || "0"))}</span>
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-3 px-6 pb-5">
          <button
            onClick={handleAdd}
            disabled={!selected || saving}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-40"
            style={{ backgroundColor: "#0d9488" }}
          >
            {saving ? "Agregando..." : "Agregar al presupuesto"}
          </button>
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm font-medium border border-gray-200 text-gray-600">
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
