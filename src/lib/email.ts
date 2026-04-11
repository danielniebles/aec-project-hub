import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.EMAIL_FROM ?? "facturacion@empresa.com.co";

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

function formatCOPEmail(n: number): string {
  return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(n);
}

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

  const greeting = client.contactName ?? client.name;

  await resend.emails.send({
    from: FROM,
    to: client.email,
    subject: `Factura ${invoice.number} — ${project.name}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #111;">
        <h2 style="color: #0d9488;">Factura ${invoice.number}</h2>
        <p>Estimado/a ${greeting},</p>
        <p>Adjuntamos la factura correspondiente al proyecto <strong>${project.name}</strong> (${project.code}).</p>
        <table style="border-collapse: collapse; width: 100%; margin: 24px 0;">
          <tr>
            <td style="padding: 8px 0; color: #555;">Concepto</td>
            <td style="padding: 8px 0; font-weight: 600;">${invoice.description}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #555;">Fecha de emisión</td>
            <td style="padding: 8px 0;">${formatDateEmail(invoice.issueDate)}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #555;">Fecha de vencimiento</td>
            <td style="padding: 8px 0; font-weight: 600; color: #b45309;">${formatDateEmail(invoice.dueDate)}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #555;">Total</td>
            <td style="padding: 8px 0; font-size: 1.2em; font-weight: 700;">${formatCOPEmail(invoice.total)}</td>
          </tr>
        </table>
        <p>Para cualquier consulta, no dude en contactarnos.</p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
        <p style="font-size: 0.85em; color: #6b7280;">Referencia interna: ${invoice.internalRef}</p>
      </div>
    `,
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

  const greeting = client.contactName ?? client.name;
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
    subject: `Recordatorio de pago — Factura ${invoice.number}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #111;">
        <h2 style="color: #b45309;">Recordatorio de pago</h2>
        <p>Estimado/a ${greeting},</p>
        <p>Le recordamos que la siguiente factura <strong>${urgencyText}</strong>:</p>
        <table style="border-collapse: collapse; width: 100%; margin: 24px 0;">
          <tr>
            <td style="padding: 8px 0; color: #555;">Factura</td>
            <td style="padding: 8px 0; font-weight: 600;">${invoice.number}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #555;">Proyecto</td>
            <td style="padding: 8px 0;">${project.name} (${project.code})</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #555;">Concepto</td>
            <td style="padding: 8px 0;">${invoice.description}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #555;">Vencimiento</td>
            <td style="padding: 8px 0; font-weight: 600; color: #b45309;">${formatDateEmail(invoice.dueDate)}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #555;">Total pendiente</td>
            <td style="padding: 8px 0; font-size: 1.2em; font-weight: 700;">${formatCOPEmail(invoice.total)}</td>
          </tr>
        </table>
        <p>Si ya realizó el pago, por favor ignote este mensaje. Para cualquier consulta, no dude en contactarnos.</p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
        <p style="font-size: 0.85em; color: #6b7280;">Referencia interna: ${invoice.internalRef}</p>
      </div>
    `,
  });
}
