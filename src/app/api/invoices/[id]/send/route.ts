import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendInvoiceSentEmail } from "@/lib/email";
import { serializeInvoice, SUGGEST_CLOSEOUT_STATUSES } from "@/lib/constants";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: {
      client: true,
      project: { select: { id: true, name: true, code: true, status: true } },
    },
  });

  if (!invoice) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (invoice.status !== "draft") {
    return NextResponse.json({ error: "Only draft invoices can be sent" }, { status: 409 });
  }

  await sendInvoiceSentEmail(
    {
      id: invoice.id,
      number: invoice.number,
      internalRef: invoice.internalRef,
      issueDate: invoice.issueDate,
      dueDate: invoice.dueDate,
      total: Number(invoice.total),
      description: invoice.description,
    },
    invoice.client,
    invoice.project
  );

  const updated = await prisma.invoice.update({
    where: { id },
    data: { status: "sent", sentAt: new Date() },
  });

  const suggestedProjectStatus =
    invoice.project && SUGGEST_CLOSEOUT_STATUSES.includes(invoice.project.status)
      ? "closeout"
      : null;

  return NextResponse.json({ ...serializeInvoice(updated), suggestedProjectStatus });
}
