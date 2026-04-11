import Link from "next/link";
import { getInvoices } from "@/lib/data/invoices";
import { formatCOP, formatDate } from "@/lib/format";
import InvoiceStatusBadge from "@/components/billing/InvoiceStatusBadge";
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
            <h1 className="text-2xl font-bold text-gray-900">Facturas</h1>
            <p className="text-sm text-gray-400 mt-0.5">{invoices.length} factura{invoices.length !== 1 ? "s" : ""}</p>
          </div>
          <Link
            href="/facturas/nueva"
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white"
            style={{ backgroundColor: "#0d9488" }}
          >
            + Nueva factura
          </Link>
        </div>

        {/* KPI chips */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl p-5 shadow-sm">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Facturado</p>
            <p className="text-xl font-bold text-gray-900">{formatCOP(totalFacturado)}</p>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm border-l-4" style={{ borderColor: "#0d9488" }}>
            <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: "#0d9488" }}>Recaudado</p>
            <p className="text-xl font-bold" style={{ color: "#0d9488" }}>{formatCOP(totalRecaudado)}</p>
          </div>
          <div className={`bg-white rounded-xl p-5 shadow-sm ${totalVencido > 0 ? "border-l-4 border-red-400" : ""}`}>
            <p className={`text-xs font-semibold uppercase tracking-wide mb-2 ${totalVencido > 0 ? "text-red-600" : "text-gray-400"}`}>
              Vencido
            </p>
            <p className={`text-xl font-bold ${totalVencido > 0 ? "text-red-600" : "text-gray-900"}`}>
              {formatCOP(totalVencido)}
            </p>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {invoices.length === 0 ? (
            <div className="px-6 py-12 text-center text-gray-400 text-sm">
              Sin facturas registradas.
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">N° Factura</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Cliente</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Proyecto</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Emisión</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Vencimiento</th>
                  <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Total</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Estado</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => (
                  <tr key={inv.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-6 py-3 font-mono text-xs font-semibold text-gray-700">{inv.number}</td>
                    <td className="px-6 py-3">
                      <Link href={`/clientes/${inv.client.id}`} className="text-teal-600 hover:underline">
                        {inv.client.name}
                      </Link>
                    </td>
                    <td className="px-6 py-3">
                      <Link href={`/proyectos/${inv.project.id}`} className="text-gray-600 hover:text-teal-600">
                        {inv.project.name}
                      </Link>
                    </td>
                    <td className="px-6 py-3 text-gray-500">{formatDate(inv.issueDate)}</td>
                    <td className="px-6 py-3 text-gray-500">{formatDate(inv.dueDate)}</td>
                    <td className="px-6 py-3 text-right font-semibold text-gray-800">{formatCOP(inv.total)}</td>
                    <td className="px-6 py-3"><InvoiceStatusBadge status={inv.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
