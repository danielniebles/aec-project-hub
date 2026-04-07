import { APULine } from "@/app/plantillas-apu/[id]/page";
import { formatCOP } from "@/lib/format";

const TYPE_LABELS: Record<string, string> = {
  material: "Material",
  labor: "Mano de Obra",
  equipment: "Equipo",
  transport: "Transporte",
  subcontract: "Subcontrato",
};

const TYPE_COLORS: Record<string, string> = {
  material: "bg-teal-50 text-teal-700",
  labor: "bg-blue-50 text-blue-700",
  equipment: "bg-gray-100 text-gray-600",
  transport: "bg-purple-50 text-purple-700",
  subcontract: "bg-orange-50 text-orange-700",
};

function getUnitPrice(line: APULine): number {
  const price = line.resource.prices[0];
  return price ? parseFloat(price.price) : 0;
}

function getLineTotal(line: APULine): number {
  const unitPrice = getUnitPrice(line);
  const qty = parseFloat(line.quantity);
  const waste = parseFloat(line.wasteFactorPct) / 100;
  return unitPrice * qty * (1 + waste);
}

interface Props {
  lines: APULine[];
  onRemove: (lineId: string) => void;
}

export default function APULineTable({ lines, onRemove }: Props) {
  const directCost = lines.reduce((sum, l) => sum + getLineTotal(l), 0);

  if (lines.length === 0) {
    return (
      <div className="px-5 py-8 text-center text-gray-400 text-sm">
        Sin insumos agregados. Usa "+ Agregar insumo" para comenzar.
      </div>
    );
  }

  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-gray-200 bg-gray-50">
          <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Recurso</th>
          <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Tipo</th>
          <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Cant.</th>
          <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Unidad</th>
          <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Desp. %</th>
          <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Unitario (COP)</th>
          <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Total</th>
          <th className="px-3 py-3"></th>
        </tr>
      </thead>
      <tbody>
        {lines.map((line) => {
          const unitPrice = getUnitPrice(line);
          const lineTotal = getLineTotal(line);
          const hasPrice = line.resource.prices.length > 0;
          return (
            <tr key={line.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
              <td className="px-5 py-3 text-teal-600 font-medium">{line.resource.description}</td>
              <td className="px-4 py-3">
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${TYPE_COLORS[line.resource.type] ?? "bg-gray-100 text-gray-600"}`}>
                  {TYPE_LABELS[line.resource.type] ?? line.resource.type}
                </span>
              </td>
              <td className="px-4 py-3 text-right text-gray-700">{parseFloat(line.quantity).toFixed(3)}</td>
              <td className="px-4 py-3 text-gray-500">{line.resource.unit}</td>
              <td className="px-4 py-3 text-right text-gray-500">{parseFloat(line.wasteFactorPct).toFixed(2)}</td>
              <td className="px-4 py-3 text-right text-gray-700">
                {hasPrice
                  ? formatCOP(unitPrice)
                  : <span className="text-red-400 text-xs">Sin precio</span>
                }
              </td>
              <td className="px-4 py-3 text-right font-medium text-gray-800">
                {hasPrice ? formatCOP(lineTotal) : "—"}
              </td>
              <td className="px-3 py-3">
                <button
                  onClick={() => onRemove(line.id)}
                  className="text-gray-300 hover:text-red-400 transition-colors text-base leading-none"
                  title="Eliminar línea"
                >
                  ×
                </button>
              </td>
            </tr>
          );
        })}
      </tbody>
      <tfoot>
        <tr className="bg-gray-50">
          <td colSpan={6} className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide text-right">
            Subtotal Costo Directo
          </td>
          <td className="px-4 py-3 text-right font-bold text-gray-800">{formatCOP(directCost)}</td>
          <td />
        </tr>
      </tfoot>
    </table>
  );
}
