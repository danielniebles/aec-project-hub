"use client";

import { useState } from "react";
import { formatCOP } from "@/lib/format";

type Commitment = {
  id: string;
  description: string;
  totalCommitted: number;
  totalPaid: number;
  totalPending: number;
};

interface Props {
  projectId: string;
  commitment: Commitment;
  onClose: () => void;
  onCreated: () => void;
}

export default function PaymentForm({ projectId, commitment, onClose, onCreated }: Props) {
  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    amount: "",
    notes: "",
  });
  const [saving, setSaving] = useState(false);

  function set(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.date || !form.amount) return;
    setSaving(true);
    await fetch(`/api/projects/${projectId}/commitments/${commitment.id}/payments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date: form.date,
        amount: parseFloat(form.amount),
        notes: form.notes || null,
      }),
    });
    setSaving(false);
    onCreated();
  }

  const amount = parseFloat(form.amount) || 0;
  const maxAmount = commitment.totalPending;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100">
          <p className="text-xs text-gray-400 mb-0.5 truncate">{commitment.description}</p>
          <h2 className="text-lg font-bold text-gray-900">Agregar abono</h2>
        </div>

        {/* Commitment summary */}
        <div className="px-6 pt-4 grid grid-cols-2 gap-3 text-xs">
          <div className="bg-gray-50 rounded-lg px-3 py-2">
            <p className="text-gray-400 uppercase tracking-wide font-semibold mb-0.5">Comprometido</p>
            <p className="font-bold text-gray-800">{formatCOP(commitment.totalCommitted)}</p>
          </div>
          <div className="rounded-lg px-3 py-2" style={{ backgroundColor: "#f0fdfa" }}>
            <p className="uppercase tracking-wide font-semibold mb-0.5" style={{ color: "#0d9488" }}>Pendiente</p>
            <p className="font-bold" style={{ color: "#0d9488" }}>{formatCOP(maxAmount)}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="px-6 pt-4 space-y-4">
            {/* Date */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                Fecha <span className="text-red-400">*</span>
              </label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => set("date", e.target.value)}
                required
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-teal-500"
              />
            </div>

            {/* Amount */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                Monto del abono <span className="text-red-400">*</span>
              </label>
              <input
                type="number"
                min="0"
                max={maxAmount}
                step="0.01"
                value={form.amount}
                onChange={(e) => set("amount", e.target.value)}
                placeholder="0"
                required
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-teal-500"
              />
              <p className="text-xs text-gray-400 mt-1">
                Máximo: {formatCOP(maxAmount)}
              </p>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                Notas <span className="text-gray-300">(opcional)</span>
              </label>
              <input
                type="text"
                value={form.notes}
                onChange={(e) => set("notes", e.target.value)}
                placeholder='Ej. "Transferencia #12345"'
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-teal-500"
              />
            </div>

            {/* Preview */}
            {amount > 0 && (
              <div className="rounded-lg px-4 py-3 text-sm" style={{ backgroundColor: "#f0fdfa" }}>
                <span className="text-gray-500">Abono a registrar:</span>
                <span className="float-right font-bold" style={{ color: "#0d9488" }}>
                  {new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(amount)}
                </span>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-5 mt-4 flex gap-3 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2 rounded-lg text-sm font-semibold text-white transition-colors disabled:opacity-50"
              style={{ backgroundColor: "#0d9488" }}
            >
              {saving ? "Guardando..." : "Registrar abono"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
