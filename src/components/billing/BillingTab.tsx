"use client";

import { useState } from "react";
import Link from "next/link";
import { formatCOP, formatDate } from "@/lib/format";
import PurchaseOrderForm from "@/components/billing/PurchaseOrderForm";
import StatusSuggestionBanner from "@/components/billing/StatusSuggestionBanner";
import InvoiceStatusBadge from "@/components/billing/InvoiceStatusBadge";
import type { ProjectDetail } from "@/lib/data/projects";

type Project = NonNullable<ProjectDetail>;

type Props = {
  project: Project;
  onRefresh: () => void;
  onStatusChange: (newStatus: string) => Promise<void>;
};

type PO = Project["purchaseOrders"][number];

export default function BillingTab({ project, onRefresh, onStatusChange }: Props) {
  const [showPOForm, setShowPOForm] = useState(false);
  const [suggestedStatus, setSuggestedStatus] = useState<string | null>(null);
  const [invoices, setInvoices] = useState<InvoiceRow[] | null>(null);
  const [loadingInvoices, setLoadingInvoices] = useState(false);

  type InvoiceRow = {
    id: string;
    number: string;
    internalRef: string;
    status: string;
    issueDate: string;
    dueDate: string;
    total: number;
    description: string;
    purchaseOrder: { number: string } | null;
  };

  // Lazy-load invoices on mount
  if (invoices === null && !loadingInvoices) {
    setLoadingInvoices(true);
    fetch(`/api/invoices?projectId=${project.id}`)
      .then((r) => r.json())
      .then((data: InvoiceRow[]) => setInvoices(data))
      .finally(() => setLoadingInvoices(false));
  }

  async function handleAcceptStatus(newStatus: string) {
    await onStatusChange(newStatus);
    setSuggestedStatus(null);
  }

  const hasClient = !!project.clientId;

  return (
    <div className="space-y-6">
      {suggestedStatus && (
        <StatusSuggestionBanner
          suggestedStatus={suggestedStatus}
          projectId={project.id}
          onAccept={handleAcceptStatus}
          onDismiss={() => setSuggestedStatus(null)}
        />
      )}

      {/* Purchase Orders */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-700">Órdenes de Compra</h3>
          {hasClient ? (
            <button
              onClick={() => setShowPOForm(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white"
              style={{ backgroundColor: "#0d9488" }}
            >
              + Agregar OC
            </button>
          ) : (
            <span className="text-xs text-gray-400">Asigne un cliente para agregar OCs</span>
          )}
        </div>

        {project.purchaseOrders.length === 0 ? (
          <div className="px-6 py-8 text-center text-gray-400 text-sm">
            Sin órdenes de compra registradas.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">N° OC</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Fecha</th>
                <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Monto</th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {project.purchaseOrders.map((po: PO) => (
                <tr key={po.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-6 py-3 font-mono text-xs font-semibold text-gray-700">{po.number}</td>
                  <td className="px-6 py-3 text-gray-500">{formatDate(po.issueDate)}</td>
                  <td className="px-6 py-3 text-right font-semibold text-gray-800">{formatCOP(po.amount)}</td>
                  <td className="px-6 py-3">
                    <button
                      onClick={async () => {
                        await fetch(`/api/projects/${project.id}/purchase-orders/${po.id}`, { method: "DELETE" });
                        onRefresh();
                      }}
                      className="text-gray-300 hover:text-red-400 transition-colors"
                      title="Eliminar"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Invoices */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-700">Facturas</h3>
          {hasClient ? (
            <Link
              href={`/facturas/nueva?projectId=${project.id}`}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white"
              style={{ backgroundColor: "#0d9488" }}
            >
              + Nueva factura
            </Link>
          ) : (
            <span className="text-xs text-gray-400">Asigne un cliente para facturar</span>
          )}
        </div>

        {loadingInvoices ? (
          <div className="px-6 py-8 text-center text-gray-400 text-sm">Cargando...</div>
        ) : invoices && invoices.length === 0 ? (
          <div className="px-6 py-8 text-center text-gray-400 text-sm">
            Sin facturas registradas. Usa &quot;Nueva factura&quot; para crear la primera.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">N° Factura</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Ref. Interna</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Concepto</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Emisión</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Vencimiento</th>
                <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Total</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Estado</th>
              </tr>
            </thead>
            <tbody>
              {(invoices ?? []).map((inv) => (
                <tr key={inv.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-6 py-3 font-mono text-xs font-semibold text-gray-700">{inv.number}</td>
                  <td className="px-6 py-3 font-mono text-xs text-gray-400">{inv.internalRef}</td>
                  <td className="px-6 py-3 text-gray-600 max-w-xs truncate">{inv.description}</td>
                  <td className="px-6 py-3 text-gray-500">{formatDate(new Date(inv.issueDate))}</td>
                  <td className="px-6 py-3 text-gray-500">{formatDate(new Date(inv.dueDate))}</td>
                  <td className="px-6 py-3 text-right font-semibold text-gray-800">{formatCOP(inv.total)}</td>
                  <td className="px-6 py-3"><InvoiceStatusBadge status={inv.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showPOForm && project.clientId && (
        <PurchaseOrderForm
          projectId={project.id}
          clientId={project.clientId}
          onClose={() => setShowPOForm(false)}
          onSuccess={(result) => {
            setShowPOForm(false);
            if (result.suggestedStatus) setSuggestedStatus(result.suggestedStatus);
            onRefresh();
          }}
        />
      )}
    </div>
  );
}
