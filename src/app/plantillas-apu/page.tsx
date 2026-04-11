"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import PageHeader from "@/components/layout/PageHeader";
import APUForm from "@/components/apu/APUForm";

type APUItem = {
  id: string;
  code: string;
  description: string;
  outputUnit: string;
  category: string;
  aiuAdminPct: string;
  aiuContingencyPct: string;
  aiuProfitPct: string;
  active: boolean;
  lines: unknown[];
};

export default function PlantillasAPUPage() {
  const [items, setItems] = useState<APUItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/apu-items");
    setItems(await res.json());
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  return (
    <div className="flex flex-col h-full">
      <PageHeader title="Plantillas APU">
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-1.5 rounded text-sm font-medium text-white bg-primary"
        >
          <span>+</span> Nueva plantilla
        </button>
      </PageHeader>

      <div className="flex-1 overflow-auto p-6">
        {loading ? (
          <div className="flex items-center justify-center h-48 text-gray-400 text-sm">Cargando plantillas...</div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-gray-400">
            <p className="text-sm">No hay plantillas APU creadas.</p>
            <p className="text-xs mt-1">Crea la primera con "+ Nueva plantilla"</p>
          </div>
        ) : (
          <table className="w-full text-sm bg-white rounded-lg shadow-sm overflow-hidden">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Código</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Descripción</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Categoría</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Unidad</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">AIU total</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Insumos</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => {
                const aiu = parseFloat(item.aiuAdminPct) + parseFloat(item.aiuContingencyPct) + parseFloat(item.aiuProfitPct);
                return (
                  <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3">
                      <Link href={`/plantillas-apu/${item.id}`} className="font-mono text-primary font-medium hover:underline">
                        {item.code}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-gray-800">
                      <Link href={`/plantillas-apu/${item.id}`} className="hover:text-primary">
                        {item.description}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{item.category}</td>
                    <td className="px-4 py-3 text-gray-500">{item.outputUnit}</td>
                    <td className="px-4 py-3 text-right text-gray-700">{aiu.toFixed(0)}%</td>
                    <td className="px-4 py-3 text-right text-gray-500">{item.lines.length}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {showForm && (
        <APUForm
          onClose={() => setShowForm(false)}
          onCreated={() => { setShowForm(false); load(); }}
        />
      )}
    </div>
  );
}
