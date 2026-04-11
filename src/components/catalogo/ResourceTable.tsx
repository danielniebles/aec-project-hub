import { Resource } from "@/app/catalogo/page";
import { formatCOP } from "@/lib/format";

const TYPE_LABELS: Record<string, string> = {
  material: "MATERIAL",
  labor: "MANO DE OBRA",
  equipment: "EQUIPO",
  transport: "TRANSPORTE",
  subcontract: "SUBCONTRATO",
};

const TYPE_COLORS: Record<string, string> = {
  material: "bg-primary/10 text-primary",
  labor: "bg-blue-100 text-blue-800",
  equipment: "bg-gray-100 text-gray-700",
  transport: "bg-purple-100 text-purple-800",
  subcontract: "bg-orange-100 text-orange-800",
};

function getActivePrice(resource: Resource) {
  if (!resource.prices.length) return null;
  return resource.prices[0];
}

interface Props {
  resources: Resource[];
  loading: boolean;
  selectedId?: string;
  onSelect: (r: Resource) => void;
}

export default function ResourceTable({ resources, loading, selectedId, onSelect }: Props) {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400 text-sm">
        Cargando insumos...
      </div>
    );
  }

  if (!resources.length) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-400">
        <p className="text-sm">No se encontraron insumos.</p>
        <p className="text-xs mt-1">Crea el primero con &quot;+ Nuevo insumo&quot;</p>
      </div>
    );
  }

  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-gray-200 bg-white">
          <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Código</th>
          <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Descripción</th>
          <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Unidad</th>
          <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Tipo</th>
          <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Precio Activo (COP)</th>
        </tr>
      </thead>
      <tbody>
        {resources.map((r) => {
          const active = getActivePrice(r);
          const isSelected = r.id === selectedId;
          return (
            <tr
              key={r.id}
              onClick={() => onSelect(r)}
              className="border-b border-gray-100 cursor-pointer transition-colors hover:bg-gray-50"
              style={isSelected ? { borderLeft: "3px solid #2D7D9A", backgroundColor: "#EBF5F9" } : { borderLeft: "3px solid transparent" }}
            >
              <td className="px-6 py-4 font-mono text-primary font-medium">{r.code}</td>
              <td className="px-4 py-4 text-gray-800">{r.description}</td>
              <td className="px-4 py-4 text-gray-600">{r.unit}</td>
              <td className="px-4 py-4">
                <span className={`px-2 py-0.5 rounded text-xs font-semibold ${TYPE_COLORS[r.type] ?? "bg-gray-100 text-gray-600"}`}>
                  {TYPE_LABELS[r.type] ?? r.type.toUpperCase()}
                </span>
              </td>
              <td className="px-6 py-4 text-right font-medium text-gray-800">
                {active ? formatCOP(active.price) : <span className="text-gray-400 text-xs">Sin precio</span>}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
