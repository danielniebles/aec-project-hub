import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const SUGGEST_CLOSEOUT_STATUSES = ["execution"];

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: {
      client: true,
      project: { select: { id: true, name: true, code: true, status: true } },
      purchaseOrder: { select: { id: true, number: true } },
    },
  });

  if (!invoice) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({
    ...invoice,
    subtotal: Number(invoice.subtotal),
    taxPct: Number(invoice.taxPct),
    taxAmount: Number(invoice.taxAmount),
    total: Number(invoice.total),
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const { status, paidAt, notes } = body;

  if (status === "overdue") {
    return NextResponse.json(
      { error: "overdue status can only be set by the cron job" },
      { status: 400 }
    );
  }

  const existing = await prisma.invoice.findUnique({
    where: { id },
    include: { project: { select: { status: true } } },
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const updateData: Record<string, unknown> = {};
  if (status !== undefined) updateData.status = status;
  if (status === "paid") updateData.paidAt = paidAt ? new Date(paidAt) : new Date();
  if (notes !== undefined) updateData.notes = notes || null;

  const invoice = await prisma.invoice.update({
    where: { id },
    data: updateData,
  });

  let suggestedProjectStatus: string | null = null;
  if (status === "sent" && existing.project && SUGGEST_CLOSEOUT_STATUSES.includes(existing.project.status)) {
    suggestedProjectStatus = "closeout";
  }

  return NextResponse.json({
    ...invoice,
    subtotal: Number(invoice.subtotal),
    taxPct: Number(invoice.taxPct),
    taxAmount: Number(invoice.taxAmount),
    total: Number(invoice.total),
    suggestedProjectStatus,
  });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const invoice = await prisma.invoice.findUnique({ where: { id } });
  if (!invoice) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (invoice.status !== "draft") {
    return NextResponse.json(
      { error: "Only draft invoices can be deleted" },
      { status: 409 }
    );
  }

  await prisma.invoice.delete({ where: { id } });
  return new NextResponse(null, { status: 204 });
}
