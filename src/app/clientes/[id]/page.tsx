import { notFound } from "next/navigation";
import Link from "next/link";
import { getClient } from "@/lib/data/clients";
import { STATUS_LABEL, TYPE_LABEL } from "@/lib/projectStatus";
import InvoiceStatusBadge from "@/components/billing/InvoiceStatusBadge";
import { formatCOP, formatDate } from "@/lib/format";

const TERM_LABEL: Record<string, string> = {
  net30: "Net 30 días",
  net60: "Net 60 días",
  net90: "Net 90 días",
  fixed_day: "Día fijo",
};

export default async function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const client = await getClient(id);

  if (!client) notFound();

  const termLabel =
    client.paymentTermType === "fixed_day"
      ? `Día ${client.fixedDay ?? "?"} de cada mes`
      : (TERM_LABEL[client.paymentTermType] ?? client.paymentTermType);

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-auto px-8 py-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-400 mb-4">
          <Link href="/clientes" className="hover:text-teal-600">Clientes</Link>
          <span>›</span>
          <span className="text-gray-600">{client.name}</span>
        </div>

        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 font-display">{client.name}</h1>
            {client.taxId && (
              <p className="text-sm text-gray-400 mt-0.5">NIT {client.taxId}</p>
            )}
          </div>
          <span className="text-xs font-medium px-3 py-1 rounded-full bg-teal-50 text-teal-700">
            {termLabel}
          </span>
        </div>

        {/* Info cards */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: "Email", value: client.email ?? "—" },
            { label: "Teléfono", value: client.phone ?? "—" },
            { label: "Contacto", value: client.contactName ?? "—" },
          ].map(({ label, value }) => (
            <div key={label} className="bg-white rounded-xl p-4 shadow-sm">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">{label}</p>
              <p className="text-sm text-gray-700">{value}</p>
            </div>
          ))}
        </div>

        {/* Projects */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-6">
          <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-700">Proyectos vinculados ({client.projects.length})</h3>
          </div>
          {client.projects.length === 0 ? (
            <p className="px-6 py-6 text-sm text-gray-400">Sin proyectos vinculados.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Código</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Nombre</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Tipo</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Estado</th>
                </tr>
              </thead>
              <tbody>
                {client.projects.map((p) => (
                  <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-6 py-3 font-mono text-xs text-gray-500">{p.code}</td>
                    <td className="px-6 py-3">
                      <Link href={`/proyectos/${p.id}`} className="text-teal-600 hover:underline font-medium">
                        {p.name}
                      </Link>
                    </td>
                    <td className="px-6 py-3 text-gray-500">{TYPE_LABEL[p.type] ?? p.type}</td>
                    <td className="px-6 py-3 text-gray-500">{STATUS_LABEL[p.status] ?? p.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Invoices */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-700">Facturas ({client.invoices.length})</h3>
          </div>
          {client.invoices.length === 0 ? (
            <p className="px-6 py-6 text-sm text-gray-400">Sin facturas registradas.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Factura</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Proyecto</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Emisión</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Vencimiento</th>
                  <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Total</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Estado</th>
                </tr>
              </thead>
              <tbody>
                {client.invoices.map((inv) => (
                  <tr key={inv.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-6 py-3 font-mono text-xs font-semibold text-gray-700">{inv.number}</td>
                    <td className="px-6 py-3">
                      <Link href={`/proyectos/${inv.project.id}`} className="text-teal-600 hover:underline">
                        {inv.project.name}
                      </Link>
                    </td>
                    <td className="px-6 py-3 text-gray-500">{formatDate(inv.issueDate)}</td>
                    <td className="px-6 py-3 text-gray-500">{formatDate(inv.dueDate)}</td>
                    <td className="px-6 py-3 text-right font-semibold text-gray-800">
                      {formatCOP(Number(inv.total))}
                    </td>
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
