"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { formatCOP, formatDate } from "@/lib/format";
import InvoiceStatusBadge from "@/components/billing/InvoiceStatusBadge";
import type { InvoiceItem } from "@/lib/data/invoices";

type ReminderFeedback = {
  type: "success" | "cooldown" | "no_email";
  nextAllowedAt?: Date;
};

type SuggestedStatus = {
  projectId: string;
  projectName: string;
  status: string;
};

type Props = {
  invoices: InvoiceItem[];
  showClient?: boolean;
  showProject?: boolean;
};

export default function InvoiceTableClient({
  invoices,
  showClient = true,
  showProject = true,
}: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [reminderFeedback, setReminderFeedback] = useState<Record<string, ReminderFeedback>>({});
  const [suggestedStatus, setSuggestedStatus] = useState<SuggestedStatus | null>(null);

  const colCount = 6 + (showClient ? 1 : 0) + (showProject ? 1 : 0);

  async function handleSend(inv: InvoiceItem) {
    setBusy(inv.id);
    try {
      const res = await fetch(`/api/invoices/${inv.id}/send`, { method: "POST" });
      const data = await res.json();
      if (data.suggestedProjectStatus) {
        setSuggestedStatus({
          projectId: inv.project.id,
          projectName: inv.project.name,
          status: data.suggestedProjectStatus,
        });
      }
      router.refresh();
    } finally {
      setBusy(null);
    }
  }

  async function handleMarkPaid(id: string) {
    setBusy(id);
    try {
      await fetch(`/api/invoices/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "paid" }),
      });
      router.refresh();
    } finally {
      setBusy(null);
    }
  }

  async function handleRemind(id: string) {
    setBusy(id);
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
      setBusy(null);
    }
  }

  async function handleDelete(id: string) {
    setBusy(id);
    try {
      await fetch(`/api/invoices/${id}`, { method: "DELETE" });
      router.refresh();
    } finally {
      setBusy(null);
    }
  }

  function dismissFeedback(id: string) {
    setReminderFeedback((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }

  if (invoices.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm px-6 py-12 text-center text-gray-400 text-sm">
        Sin facturas registradas.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {suggestedStatus && (
        <div className="flex items-center gap-3 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl text-sm">
          <span className="text-amber-800 flex-1">
            Se sugiere cambiar el estado del proyecto <strong>{suggestedStatus.projectName}</strong> a <strong>Cierre</strong>.
          </span>
          <Link
            href={`/proyectos/${suggestedStatus.projectId}`}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white"
            style={{ backgroundColor: "#0d9488" }}
          >
            Ver proyecto
          </Link>
          <button
            onClick={() => setSuggestedStatus(null)}
            className="text-amber-400 hover:text-amber-600"
            aria-label="Ignorar sugerencia"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">N° Factura</th>
              {showClient && <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Cliente</th>}
              {showProject && <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Proyecto</th>}
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Emisión</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Vencimiento</th>
              <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Total</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Estado</th>
              <th className="px-6 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((inv) => {
              const feedback = reminderFeedback[inv.id];
              const isBusy = busy === inv.id;

              return (
                <React.Fragment key={inv.id}>
                  <tr className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-6 py-3 font-mono text-xs font-semibold text-gray-700">{inv.number}</td>
                    {showClient && (
                      <td className="px-6 py-3">
                        <Link href={`/clientes/${inv.client.id}`} className="text-teal-600 hover:underline">
                          {inv.client.name}
                        </Link>
                      </td>
                    )}
                    {showProject && (
                      <td className="px-6 py-3">
                        <Link href={`/proyectos/${inv.project.id}`} className="text-gray-600 hover:text-teal-600">
                          {inv.project.name}
                        </Link>
                      </td>
                    )}
                    <td className="px-6 py-3 text-gray-500">{formatDate(inv.issueDate)}</td>
                    <td className="px-6 py-3 text-gray-500">{formatDate(inv.dueDate)}</td>
                    <td className="px-6 py-3 text-right font-semibold text-gray-800">{formatCOP(inv.total)}</td>
                    <td className="px-6 py-3"><InvoiceStatusBadge status={inv.status} /></td>
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-2 justify-end">
                        {inv.status === "draft" && (
                          <>
                            <button
                              onClick={() => handleSend(inv)}
                              disabled={isBusy}
                              className="px-2.5 py-1 rounded text-xs font-semibold text-white disabled:opacity-50"
                              style={{ backgroundColor: "#0d9488" }}
                            >
                              Enviar
                            </button>
                            <button
                              onClick={() => handleDelete(inv.id)}
                              disabled={isBusy}
                              className="text-gray-300 hover:text-red-400 transition-colors disabled:opacity-50"
                              title="Eliminar borrador"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                              </svg>
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
                      <td colSpan={colCount - 1} className="px-6 py-2 text-xs">
                        {feedback.type === "success" && (
                          <span className="text-teal-600">
                            Recordatorio enviado.{" "}
                            {feedback.nextAllowedAt && (
                              <>Próximo disponible: {formatDate(feedback.nextAllowedAt)}</>
                            )}
                          </span>
                        )}
                        {feedback.type === "cooldown" && (
                          <span className="text-amber-600">
                            Período de espera activo.{" "}
                            {feedback.nextAllowedAt && (
                              <>Próximo recordatorio disponible el {formatDate(feedback.nextAllowedAt)}</>
                            )}
                          </span>
                        )}
                        {feedback.type === "no_email" && (
                          <span className="text-red-500">El cliente no tiene email registrado.</span>
                        )}
                      </td>
                      <td className="px-6 py-2 text-right">
                        <button
                          onClick={() => dismissFeedback(inv.id)}
                          className="text-gray-300 hover:text-gray-500"
                          aria-label="Cerrar"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
