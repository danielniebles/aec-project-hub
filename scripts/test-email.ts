import { Resend } from "resend";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const FROM = process.env.EMAIL_FROM ?? "no-responder@terraazul.co";
const TO = "javier.niebles@gmail.com";
const TEMPLATE_NAME = "new_invoice";

async function main() {
  const resend = new Resend(process.env.RESEND_API_KEY);

  const TEMPLATE_ID = process.argv[2]; // pass template ID as CLI arg

  if (TEMPLATE_ID) {
    // Send via Resend template — use raw fetch to bypass SDK html/text validation
    console.log(`Sending test email via template ID "${TEMPLATE_ID}" to ${TO}...`);

    const { data, error } = await resend.emails.send({
      from: FROM,
      to: TO,
      template: {
        id: TEMPLATE_ID,
        variables: TEMPLATE_ID === "payment_reminder" ? {
          contact_name: "Daniel",
          urgency_text: "vence mañana",
          invoice_number: "FAC-2026-042",
          project_name: "Proyecto Demo",
          project_code: "PRJ-2025-001",
          invoice_description: "Anticipo 40% — Diseño arquitectónico",
          due_date: "12 de abril de 2026",
          total_amount: "$12.500.000",
          internal_ref: "INT-2026-001",
        } : {
          contact_name: "Daniel",
          project_name: "Proyecto Demo",
          project_code: "PRJ-2025-001",
          invoice_description: "Anticipo 40% — Diseño arquitectónico",
          issue_date: "11/04/2026",
          due_date: "11/05/2026",
          total_amount: "$12.500.000",
          internal_ref: "INT-2026-001",
        },
      },
    });

    if (error) { console.error("Failed:", error); process.exit(1); }
    console.log("Sent via template:", data);

  } else {
    // Fallback: send plain HTML to verify key + domain work
    console.log(`No template ID provided. Sending plain HTML test to ${TO}...`);
    console.log("(To use a template, run: npx tsx scripts/test-email.ts <template_id>)\n");

    const { data, error } = await resend.emails.send({
      from: FROM,
      to: TO,
      subject: "Prueba de conexión — AEC Project Hub",
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:32px;color:#111;">
          <h2 style="color:#0d9488;">Conexión verificada</h2>
          <p>El servicio de email está funcionando correctamente desde <strong>${FROM}</strong>.</p>
          <p style="color:#6b7280;font-size:0.85em;">Este es un email de prueba del AEC Project Hub.</p>
        </div>
      `,
    });

    if (error) { console.error("Failed:", error); process.exit(1); }
    console.log("Plain test email sent:", data);
  }
}

main();
