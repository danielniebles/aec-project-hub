"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Trash2, X } from "lucide-react";
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

type InvoiceRow = {
  id: string;
  number: string;
  internalRef: string;
  status: string;
  issueDate: string;
  dueDate: string;
  total: number;
  description: string;
  reminderSentAt: string | null;
  purchaseOrder: { number: string } | null;
};

type ReminderFeedback = {
  type: "success" | "cooldown" | "no_email";
  nextAllowedAt?: Date;
};

export default function BillingTab({ project, onRefresh, onStatusChange }: Props) {
  const [showPOForm, setShowPOForm] = useState(false);
  const [suggestedStatus, setSuggestedStatus] = useState<string | null>(null);
  const [invoices, setInvoices] = useState<InvoiceRow[] | null>(null);
  const [loadingInvoices, setLoadingInvoices] = useState(false);
  const [invoiceBusy, setInvoiceBusy] = useState<string | null>(null);
  const [reminderFeedback, setReminderFeedback] = useState<Record<string, ReminderFeedback>>({});

  const loadInvoices = useCallback(() => {
    setLoadingInvoices(true);
    fetch(`/api/invoices?projectId=${project.id}`)
      .then((r) => r.json())
      .then((data: InvoiceRow[]) => setInvoices(data))
      .finally(() => setLoadingInvoices(false));
  }, [project.id]);

  useEffect(() => {
    loadInvoices();
  }, [loadInvoices]);

  async function handleAcceptStatus(newStatus: string) {
    await onStatusChange(newStatus);
    setSuggestedStatus(null);
  }

  async function handleSendInvoice(inv: InvoiceRow) {
    setInvoiceBusy(inv.id);
    try {
      const res = await fetch(`/api/invoices/${inv.id}/send`, { method: "POST" });
      const data = await res.json();
      if (data.suggestedProjectStatus) setSuggestedStatus(data.suggestedProjectStatus);
      loadInvoices();
    } finally {
      setInvoiceBusy(null);
    }
  }

  async function handleMarkPaid(id: string) {
    setInvoiceBusy(id);
    try {
      await fetch(`/api/invoices/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "paid" }),
      });
      loadInvoices();
    } finally {
      setInvoiceBusy(null);
    }
  }

  async function handleRemind(id: string) {
    setInvoiceBusy(id);
    try {
      const res = await fetch(`/api/invoices/${id}/remind`, { method: "POST" });
      const data = await res.json();
      if (res.status === 429) {
        setReminderFeedback((prev) => ({
          ...prev,
          [id]: { type: "cooldown", nextAllowedAt: new Date(data.nextAllowedAt) },
        }));
      } else if (res.status === 422) {
        setReminderFeedback((prev) => ({ ...prev, [id]: { type: "no_email" } }));
      } else {
        setReminderFeedback((prev) => ({
          ...prev,
          [id]: { type: "success", nextAllowedAt: new Date(data.nextAllowedAt) },
        }));
      }
    } finally {
      setInvoiceBusy(null);
    }
  }

  async function handleDeleteInvoice(id: string) {
    setInvoiceBusy(id);
    try {
      await fetch(`/api/invoices/${id}`, { method: "DELETE" });
      loadInvoices();
    } finally {
      setInvoiceBusy(null);
    }
  }

  function dismissReminderFeedback(id: string) {
    setReminderFeedback((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
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
                      <Trash2 size={16} />
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
                <th className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {(invoices ?? []).map((inv) => {
                const feedback = reminderFeedback[inv.id];
                const isBusy = invoiceBusy === inv.id;
                return (
                  <React.Fragment key={inv.id}>
                    <tr className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="px-6 py-3 font-mono text-xs font-semibold text-gray-700">{inv.number}</td>
                      <td className="px-6 py-3 font-mono text-xs text-gray-400">{inv.internalRef}</td>
                      <td className="px-6 py-3 text-gray-600 max-w-xs truncate">{inv.description}</td>
                      <td className="px-6 py-3 text-gray-500">{formatDate(new Date(inv.issueDate))}</td>
                      <td className="px-6 py-3 text-gray-500">{formatDate(new Date(inv.dueDate))}</td>
                      <td className="px-6 py-3 text-right font-semibold text-gray-800">{formatCOP(inv.total)}</td>
                      <td className="px-6 py-3"><InvoiceStatusBadge status={inv.status} /></td>
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-2 justify-end">
                          {inv.status === "draft" && (
                            <>
                              <button
                                onClick={() => handleSendInvoice(inv)}
                                disabled={isBusy}
                                className="px-2.5 py-1 rounded text-xs font-semibold text-white disabled:opacity-50"
                                style={{ backgroundColor: "#0d9488" }}
                              >
                                Enviar
                              </button>
                              <button
                                onClick={() => handleDeleteInvoice(inv.id)}
                                disabled={isBusy}
                                className="text-gray-300 hover:text-red-400 transition-colors disabled:opacity-50"
                                title="Eliminar borrador"
                              >
                                <Trash2 size={16} />
                              </button>
                            </>
                          )}
                          {(inv.status === "sent" || inv.status === "overdue") && (
                            <>
                              <button
                                onClick={() => handleMarkPaid(inv.id)}
                                disabled={isBusy}
                                className="px-2.5 py-1 rounded text-xs font-semibold text-white disabled:opacity-50"
                                style={{ backgroundColor: "#0d9488" }}
                              >
                                Marcar pagada
                              </button>
                              <button
                                onClick={() => handleRemind(inv.id)}
                                disabled={isBusy}
                                className="px-2.5 py-1 rounded text-xs font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                              >
                                Notificar
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                    {feedback && (
                      <tr className="border-b border-gray-50 bg-gray-50">
                        <td colSpan={7} className="px-6 py-2 text-xs">
                          {feedback.type === "success" && (
                            <span className="text-teal-600">
                              Recordatorio enviado.{" "}
                              {feedback.nextAllowedAt && <>Próximo disponible: {formatDate(feedback.nextAllowedAt)}</>}
                            </span>
                          )}
                          {feedback.type === "cooldown" && (
                            <span className="text-amber-600">
                              Período de espera activo.{" "}
                              {feedback.nextAllowedAt && <>Próximo recordatorio disponible el {formatDate(feedback.nextAllowedAt)}</>}
                            </span>
                          )}
                          {feedback.type === "no_email" && (
                            <span className="text-red-500">El cliente no tiene email registrado.</span>
                          )}
                        </td>
                        <td className="px-6 py-2 text-right">
                          <button
                            onClick={() => dismissReminderFeedback(inv.id)}
                            className="text-gray-300 hover:text-gray-500"
                            aria-label="Cerrar"
                          >
                            <X size={14} />
                          </button>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
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
