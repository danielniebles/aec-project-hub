import { Resend } from "resend";
import { formatCOP } from "@/lib/format";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.EMAIL_FROM ?? "no-responder@terraazul.co";

type InvoiceEmailData = {
  id: string;
  number: string;
  internalRef: string;
  issueDate: Date;
  dueDate: Date;
  total: number;
  description: string;
};

type ClientEmailData = {
  name: string;
  email: string | null;
  contactName?: string | null;
};

type ProjectEmailData = {
  name: string;
  code: string;
};

function formatDateEmail(d: Date): string {
  return new Intl.DateTimeFormat("es-CO", { day: "numeric", month: "long", year: "numeric" }).format(new Date(d));
}

export async function sendInvoiceSentEmail(
  invoice: InvoiceEmailData,
  client: ClientEmailData,
  project: ProjectEmailData
): Promise<void> {
  if (!client.email) {
    console.log(`[email] Skipping sendInvoiceSentEmail — client has no email (invoice ${invoice.number})`);
    return;
  }

  await resend.emails.send({
    from: FROM,
    to: client.email,
    template: {
      id: "new_invoice",
      variables: {
        contact_name: client.contactName ?? client.name,
        project_name: project.name,
        project_code: project.code,
        invoice_description: invoice.description,
        issue_date: formatDateEmail(invoice.issueDate),
        due_date: formatDateEmail(invoice.dueDate),
        total_amount: formatCOP(invoice.total),
        internal_ref: invoice.internalRef,
      },
    },
  });
}

export async function sendReminderEmail(
  invoice: InvoiceEmailData,
  client: ClientEmailData,
  project: ProjectEmailData
): Promise<void> {
  if (!client.email) {
    console.log(`[email] Skipping sendReminderEmail — client has no email (invoice ${invoice.number})`);
    return;
  }

  const daysUntilDue = Math.ceil(
    (new Date(invoice.dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );
  const urgencyText = daysUntilDue <= 0
    ? "venció hoy o está vencida"
    : daysUntilDue === 1
    ? "vence mañana"
    : `vence en ${daysUntilDue} días`;

  await resend.emails.send({
    from: FROM,
    to: client.email,
    template: {
      id: "payment_reminder",
      variables: {
        contact_name: client.contactName ?? client.name,
        urgency_text: urgencyText,
        invoice_number: invoice.number,
        project_name: project.name,
        project_code: project.code,
        invoice_description: invoice.description,
        due_date: formatDateEmail(invoice.dueDate),
        total_amount: formatCOP(invoice.total),
        internal_ref: invoice.internalRef,
      },
    },
  });
}
