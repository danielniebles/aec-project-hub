import { APUItem, APULine } from "@/app/plantillas-apu/[id]/page";
import { formatCOP } from "@/lib/format";

function getLineTotal(line: APULine): number {
  const price = line.resource.prices[0];
  if (!price) return 0;
  const unitPrice = parseFloat(price.price);
  const qty = parseFloat(line.quantity);
  const waste = parseFloat(line.wasteFactorPct) / 100;
  return unitPrice * qty * (1 + waste);
}

function getPriceSource(item: APUItem): string {
  const prices = item.lines.flatMap((l) => l.resource.prices);
  if (!prices.length) return "Sin precio";
  const latest = prices[0];
  if (!latest) return "Sin precio";
  const date = new Date(latest.validFrom).toLocaleDateString("es-CO", { month: "long", year: "numeric" });
  return `Vigencia: ${date} — ${latest.sourceName}`;
}

interface Props {
  item: APUItem;
  aiu: { admin: string; contingency: string; profit: string };
}

export default function APUSummaryPanel({ item, aiu }: Props) {
  const directCost = item.lines.reduce((sum, l) => sum + getLineTotal(l), 0);
  const aiuPct = (parseFloat(aiu.admin) + parseFloat(aiu.contingency) + parseFloat(aiu.profit)) / 100;
  const aiuAmount = directCost * aiuPct;
  const unitPrice = directCost + aiuAmount;
  const aiuTotalPct = (parseFloat(aiu.admin) + parseFloat(aiu.contingency) + parseFloat(aiu.profit)).toFixed(0);
  const priceSource = getPriceSource(item);

  return (
    <div className="w-64 border-l border-gray-200 bg-gray-900 flex flex-col shrink-0">
      <div className="p-5 border-b border-gray-700">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-4">Resumen Final APU</p>

        <div className="mb-4">
          <p className="text-xs text-gray-400 mb-1">Costo directo</p>
          <p className="text-xl font-bold text-white">{formatCOP(directCost)}</p>
        </div>

        <div className="mb-5">
          <p className="text-xs text-gray-400 mb-1">AIU ({aiuTotalPct}%)</p>
          <p className="text-xl font-bold text-white">{formatCOP(aiuAmount)}</p>
          <div className="h-0.5 bg-teal-500 mt-2 rounded" style={{ width: `${Math.min(aiuPct * 100 * 3, 100)}%` }} />
        </div>

        <div className="bg-gray-800 rounded-lg p-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Precio Unitario Total</p>
          <p className="text-3xl font-bold text-teal-400">{formatCOP(unitPrice)}</p>
          <p className="text-xs text-gray-500 mt-2">{priceSource}</p>
        </div>
      </div>

      <div className="flex-1" />

      <div className="p-4">
        <button
          className="flex items-center justify-center gap-2 w-full py-3 rounded text-sm font-medium text-white border border-gray-600 hover:border-gray-400 transition-colors"
          onClick={() => alert("Exportar PDF — próximamente")}
        >
          ↓ Exportar PDF
        </button>
      </div>
    </div>
  );
}
