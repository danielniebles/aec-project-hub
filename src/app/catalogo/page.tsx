"use client";

import { useEffect, useState } from "react";
import PageHeader from "@/components/layout/PageHeader";
import ResourceTable from "@/components/catalogo/ResourceTable";
import ResourcePricePanel from "@/components/catalogo/ResourcePricePanel";
import ResourceForm from "@/components/catalogo/ResourceForm";

export type ResourcePrice = {
  id: string;
  sourceType: string;
  sourceName: string;
  price: string;
  currency: string;
  validFrom: string;
  validUntil: string | null;
  notes: string | null;
};

export type Resource = {
  id: string;
  code: string;
  description: string;
  unit: string;
  type: string;
  category: string;
  prices: ResourcePrice[];
};

export default function CatalogoPage() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("");
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);
  const [showForm, setShowForm] = useState(false);

  async function loadResources() {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (filterType) params.set("type", filterType);
    const res = await fetch(`/api/resources?${params}`);
    const data = await res.json();
    setResources(data);
    setLoading(false);
  }

  useEffect(() => {
    loadResources();
  }, [search, filterType]);

  function handleSelect(resource: Resource) {
    setSelectedResource(resource);
  }

  async function handlePriceAdded() {
    await loadResources();
    // Refresh selected resource prices
    if (selectedResource) {
      const res = await fetch(`/api/resources?`);
      const data: Resource[] = await res.json();
      const updated = data.find((r) => r.id === selectedResource.id);
      if (updated) setSelectedResource(updated);
    }
  }

  return (
    <div className="flex flex-col h-full">
      <PageHeader title="The Architectural Ledger">
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Buscar insumos por nombre..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border border-gray-200 rounded px-3 py-1.5 text-sm w-56 focus:outline-none focus:border-primary"
          />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="border border-gray-200 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-primary"
          >
            <option value="">Tipo</option>
            <option value="material">Material</option>
            <option value="labor">Mano de obra</option>
            <option value="equipment">Equipo</option>
            <option value="transport">Transporte</option>
            <option value="subcontract">Subcontrato</option>
          </select>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded text-sm font-medium text-white bg-primary"
          >
            <span>+</span> Nuevo insumo
          </button>
        </div>
      </PageHeader>

      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 overflow-auto">
          <ResourceTable
            resources={resources}
            loading={loading}
            selectedId={selectedResource?.id}
            onSelect={handleSelect}
          />
        </div>

        {selectedResource && (
          <ResourcePricePanel
            resource={selectedResource}
            onClose={() => setSelectedResource(null)}
            onPriceAdded={handlePriceAdded}
          />
        )}
      </div>

      {showForm && (
        <ResourceForm
          onClose={() => setShowForm(false)}
          onCreated={() => { setShowForm(false); loadResources(); }}
        />
      )}
    </div>
  );
}
