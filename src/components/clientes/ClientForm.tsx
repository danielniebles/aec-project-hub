"use client";

import { useState } from "react";

type Props = {
  onClose: () => void;
  onCreated: () => void;
};

const PAYMENT_TERM_LABELS: Record<string, string> = {
  net30: "Net 30 días",
  net60: "Net 60 días",
  net90: "Net 90 días",
  fixed_day: "Día fijo del mes",
};

export default function ClientForm({ onClose, onCreated }: Props) {
  const [name, setName] = useState("");
  const [taxId, setTaxId] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [contactName, setContactName] = useState("");
  const [paymentTermType, setPaymentTermType] = useState("net30");
  const [fixedDay, setFixedDay] = useState("10");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const res = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name, taxId, email, phone, address, contactName,
          paymentTermType,
          fixedDay: paymentTermType === "fixed_day" ? Number(fixedDay) : undefined,
          notes,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error al guardar");
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl mx-4">
        <div className="px-7 pt-6 pb-4 flex items-start justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Nuevo cliente</h2>
            <p className="text-sm text-gray-400 mt-0.5">Ingrese los datos del cliente o firma.</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none mt-1">×</button>
        </div>

        <form onSubmit={handleSubmit} className="px-7 pb-0 space-y-4">
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Nombre o razón social</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej. Constructora El Dorado S.A.S."
              required
              className="w-full mt-1 border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-teal-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">NIT</label>
              <input
                value={taxId}
                onChange={(e) => setTaxId(e.target.value)}
                placeholder="900.123.456-7"
                className="w-full mt-1 border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-teal-500"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Contacto</label>
              <input
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                placeholder="Nombre del contacto"
                className="w-full mt-1 border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-teal-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="facturacion@cliente.com"
                className="w-full mt-1 border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-teal-500"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Teléfono</label>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+57 300 000 0000"
                className="w-full mt-1 border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-teal-500"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Dirección</label>
            <input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Cra. 7 # 32-16, Bogotá"
              className="w-full mt-1 border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-teal-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Condición de pago</label>
              <select
                value={paymentTermType}
                onChange={(e) => setPaymentTermType(e.target.value)}
                className="w-full mt-1 border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-teal-500"
              >
                {Object.entries(PAYMENT_TERM_LABELS).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
            </div>
            {paymentTermType === "fixed_day" && (
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Día del mes (1–28)</label>
                <input
                  type="number"
                  value={fixedDay}
                  onChange={(e) => setFixedDay(e.target.value)}
                  min="1"
                  max="28"
                  className="w-full mt-1 border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-teal-500"
                />
              </div>
            )}
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Notas</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full mt-1 border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-teal-500 resize-none"
            />
          </div>

          {error && <p className="text-xs text-red-600">{error}</p>}
        </form>

        <div className="flex items-center justify-end gap-3 px-7 py-5 bg-gray-50 rounded-b-2xl mt-4">
          <button onClick={onClose} className="px-5 py-2.5 text-sm font-medium text-gray-600 hover:text-gray-800">
            Cancelar
          </button>
          <button
            onClick={handleSubmit as never}
            disabled={saving}
            className="px-6 py-2.5 rounded-lg text-sm font-medium text-white disabled:opacity-50"
            style={{ backgroundColor: "#0d9488" }}
          >
            {saving ? "Guardando..." : "Crear cliente"}
          </button>
        </div>
      </div>
    </div>
  );
}
