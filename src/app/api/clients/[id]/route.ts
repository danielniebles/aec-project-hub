import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const client = await prisma.client.findUnique({
    where: { id },
    include: {
      projects: {
        select: { id: true, code: true, name: true, status: true, type: true },
        orderBy: { createdAt: "desc" },
      },
      invoices: {
        select: {
          id: true,
          number: true,
          internalRef: true,
          status: true,
          issueDate: true,
          dueDate: true,
          total: true,
          project: { select: { id: true, name: true, code: true } },
        },
        orderBy: { issueDate: "desc" },
      },
      _count: { select: { projects: true, invoices: true } },
    },
  });

  if (!client) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(client);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const { name, taxId, email, phone, address, contactName, paymentTermType, fixedDay, notes, active } = body;

  if (paymentTermType === "fixed_day") {
    const day = Number(fixedDay);
    if (!fixedDay || day < 1 || day > 28) {
      return NextResponse.json(
        { error: "fixedDay must be between 1 and 28 when paymentTermType is fixed_day" },
        { status: 400 }
      );
    }
  }

  const client = await prisma.client.update({
    where: { id },
    data: {
      ...(name !== undefined && { name }),
      ...(taxId !== undefined && { taxId: taxId || null }),
      ...(email !== undefined && { email: email || null }),
      ...(phone !== undefined && { phone: phone || null }),
      ...(address !== undefined && { address: address || null }),
      ...(contactName !== undefined && { contactName: contactName || null }),
      ...(paymentTermType !== undefined && { paymentTermType }),
      ...(paymentTermType !== undefined && {
        fixedDay: paymentTermType === "fixed_day" ? Math.min(Number(fixedDay), 28) : null,
      }),
      ...(notes !== undefined && { notes: notes || null }),
      ...(active !== undefined && { active }),
    },
  });

  return NextResponse.json(client);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const client = await prisma.client.findUnique({
    where: { id },
    include: { _count: { select: { projects: true, invoices: true } } },
  });

  if (!client) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (client._count.projects > 0 || client._count.invoices > 0) {
    return NextResponse.json(
      { error: "Cannot delete a client with linked projects or invoices" },
      { status: 409 }
    );
  }

  await prisma.client.delete({ where: { id } });
  return new NextResponse(null, { status: 204 });
}
