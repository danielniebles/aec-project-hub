import Link from "next/link";
import { getInvoices } from "@/lib/data/invoices";
import { formatCOP } from "@/lib/format";
import InvoiceTableClient from "@/components/billing/InvoiceTableClient";
import PageHeader from "@/components/layout/PageHeader";

export default async function FacturasPage() {
  const invoices = await getInvoices();

  const totalFacturado = invoices.reduce((s, i) => s + i.total, 0);
  const totalRecaudado = invoices
    .filter((i) => i.status === "paid")
    .reduce((s, i) => s + i.total, 0);
  const totalVencido = invoices
    .filter((i) => i.status === "overdue")
    .reduce((s, i) => s + i.total, 0);

  return (
    <div className="flex flex-col h-full">
      <PageHeader title="" />

      <div className="flex-1 overflow-auto px-8 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 font-display">Facturas</h1>
            <p className="text-sm text-gray-400 mt-0.5">{invoices.length} factura{invoices.length !== 1 ? "s" : ""}</p>
          </div>
          <Link
            href="/facturas/nueva"
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white bg-primary"
          >
            + Nueva factura
          </Link>
        </div>

        {/* KPI chips */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl p-5 shadow-sm">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Facturado</p>
            <p className="text-xl font-bold text-gray-900 font-display">{formatCOP(totalFacturado)}</p>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm border-l-4 border-primary">
            <p className="text-xs font-semibold uppercase tracking-wide mb-2 text-primary">Recaudado</p>
            <p className="text-xl font-bold font-display text-primary">{formatCOP(totalRecaudado)}</p>
          </div>
          <div className={`bg-white rounded-xl p-5 shadow-sm ${totalVencido > 0 ? "border-l-4 border-red-400" : ""}`}>
            <p className={`text-xs font-semibold uppercase tracking-wide mb-2 ${totalVencido > 0 ? "text-red-600" : "text-gray-400"}`}>
              Vencido
            </p>
            <p className={`text-xl font-bold font-display ${totalVencido > 0 ? "text-red-600" : "text-gray-900"}`}>
              {formatCOP(totalVencido)}
            </p>
          </div>
        </div>

        <InvoiceTableClient invoices={invoices} />
      </div>
    </div>
  );
}
