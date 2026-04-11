"use client";

import { useState, useEffect } from "react";
import PageHeader from "@/components/layout/PageHeader";
import ClientCard from "@/components/clientes/ClientCard";
import ClientForm from "@/components/clientes/ClientForm";

type ClientRow = {
  id: string;
  name: string;
  taxId: string | null;
  email: string | null;
  contactName: string | null;
  paymentTermType: string;
  fixedDay: number | null;
  active: boolean;
  _count: { projects: number; invoices: number };
};

export default function ClientesPage() {
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);

  async function load() {
    const qs = search ? `?search=${encodeURIComponent(search)}` : "";
    const res = await fetch(`/api/clients${qs}`);
    const data = await res.json();
    setClients(data);
  }

  useEffect(() => {
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  return (
    <div className="flex flex-col h-full">
      <PageHeader title="">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar cliente..."
          className="border border-gray-200 rounded-lg px-4 py-1.5 text-sm w-64 focus:outline-none focus:border-teal-500"
        />
      </PageHeader>

      <div className="flex-1 overflow-auto px-8 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Clientes</h1>
            <p className="text-sm text-gray-400 mt-0.5">{clients.length} cliente{clients.length !== 1 ? "s" : ""} activo{clients.length !== 1 ? "s" : ""}</p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white"
            style={{ backgroundColor: "#0d9488" }}
          >
            + Nuevo cliente
          </button>
        </div>

        {clients.length === 0 ? (
          <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
            {search ? "Sin resultados para la búsqueda." : "No hay clientes registrados. Crea el primero."}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {clients.map((c) => (
              <ClientCard key={c.id} client={c} />
            ))}
          </div>
        )}
      </div>

      {showForm && (
        <ClientForm
          onClose={() => setShowForm(false)}
          onCreated={() => {
            setShowForm(false);
            load();
          }}
        />
      )}
    </div>
  );
}
