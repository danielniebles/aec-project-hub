"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { formatCOP } from "@/lib/format";
import { computeAPUUnitPrice } from "@/lib/apuCalc";

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

interface Props {
  projectId: string;
  costItemId: string;
  currentDescription: string;
  onClose: () => void;
  onAssigned: () => void;
}

export default function AssignAPUModal({
  projectId,
  costItemId,
  currentDescription,
  onClose,
  onAssigned,
}: Props) {
  const [items, setItems] = useState<APUItem[]>([]);
  const [selected, setSelected] = useState<APUItem | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/apu-items").then((r) => r.json()).then(setItems);
  }, []);

  async function handleAssign() {
    if (!selected) return;
    setSaving(true);
    await fetch(`/api/projects/${projectId}/cost-items/${costItemId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ apuItemId: selected.id }),
    });
    setSaving(false);
    onAssigned();
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col max-h-[80vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-3 border-b border-gray-100">
          <div>
            <p className="text-xs text-gray-400 mb-0.5 truncate">{currentDescription}</p>
            <h2 className="text-base font-bold text-gray-900">Asignar APU</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>

        {/* Warning */}
        <div className="mx-6 mt-4 px-4 py-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-700">
          Esto reemplazará la descripción, unidad y precio unitario del ítem con los valores del APU seleccionado.
        </div>

        {/* APU list */}
        <div className="flex-1 overflow-auto px-6 py-4 space-y-2">
          {items.map((item) => {
            const unitPrice = computeAPUUnitPrice(item);
            const isSelected = selected?.id === item.id;
            return (
              <div
                key={item.id}
                onClick={() => setSelected(item)}
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

        {/* Footer */}
        <div className="flex gap-3 px-6 pb-5 pt-4 border-t border-gray-100">
          <button
            onClick={handleAssign}
            disabled={!selected || saving}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-40"
            style={{ backgroundColor: "#0d9488" }}
          >
            {saving ? "Asignando..." : "Asignar APU"}
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
