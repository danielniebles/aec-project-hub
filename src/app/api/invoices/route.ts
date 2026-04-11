import { NextRequest, NextResponse } from "next/server";
import { InvoiceStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { computeDueDate, generateInternalRef } from "@/lib/billing";
import { serializeInvoice } from "@/lib/constants";

export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams;

  const rawStatus = p.get("status");
  const status =
    rawStatus && Object.values(InvoiceStatus).includes(rawStatus as InvoiceStatus)
      ? (rawStatus as InvoiceStatus)
      : undefined;

  const invoices = await prisma.invoice.findMany({
    where: {
      ...(p.get("clientId") && { clientId: p.get("clientId")! }),
      ...(p.get("projectId") && { projectId: p.get("projectId")! }),
      ...(status && { status }),
      ...(p.get("dueBefore") && { dueDate: { lte: new Date(p.get("dueBefore")!) } }),
    },
    include: {
      client: { select: { id: true, name: true } },
      project: { select: { id: true, name: true, code: true } },
      purchaseOrder: { select: { id: true, number: true } },
    },
    orderBy: { issueDate: "desc" },
  });

  return NextResponse.json(invoices.map(serializeInvoice));
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const {
    number,
    clientId,
    projectId,
    purchaseOrderId,
    issueDate,
    subtotal,
    taxPct = 19,
    description,
    notes,
  } = body;

  if (!number || !clientId || !projectId || !issueDate || subtotal === undefined || !description) {
    return NextResponse.json(
      { error: "number, clientId, projectId, issueDate, subtotal, and description are required" },
      { status: 400 }
    );
  }

  const client = await prisma.client.findUnique({ where: { id: clientId } });
  if (!client) return NextResponse.json({ error: "Client not found" }, { status: 404 });

  const dueDate = computeDueDate(new Date(issueDate), client);
  const subtotalNum = Number(subtotal);
  const taxPctNum = Number(taxPct);
  const taxAmount = subtotalNum * (taxPctNum / 100);
  const total = subtotalNum + taxAmount;
  const year = new Date(issueDate).getFullYear();

  const invoice = await prisma.$transaction(async (tx) => {
    const internalRef = await generateInternalRef(tx, year);
    return tx.invoice.create({
      data: {
        number,
        internalRef,
        clientId,
        projectId,
        purchaseOrderId: purchaseOrderId || null,
        issueDate: new Date(issueDate),
        dueDate,
        subtotal: subtotalNum,
        taxPct: taxPctNum,
        taxAmount,
        total,
        description,
        notes: notes || null,
      },
      include: {
        client: { select: { id: true, name: true } },
        project: { select: { id: true, name: true, code: true } },
      },
    });
  });

  return NextResponse.json(serializeInvoice(invoice), { status: 201 });
}
