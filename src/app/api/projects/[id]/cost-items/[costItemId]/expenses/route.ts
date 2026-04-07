import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string; costItemId: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { costItemId } = await params;
  const expenses = await prisma.projectExpense.findMany({
    where: { costItemId },
    include: { resource: true },
    orderBy: { date: "desc" },
  });
  return NextResponse.json(expenses);
}

export async function POST(req: NextRequest, { params }: Params) {
  const { id: projectId, costItemId } = await params;
  const body = await req.json();

  const expense = await prisma.projectExpense.create({
    data: {
      projectId,
      costItemId,
      resourceId: body.resourceId ?? null,
      description: body.description,
      date: new Date(body.date),
      quantity: body.quantity ? parseFloat(body.quantity) : null,
      unit: body.unit ?? null,
      unitCost: body.unitCost ? parseFloat(body.unitCost) : null,
      total: parseFloat(body.total),
      notes: body.notes ?? null,
    },
    include: { resource: true },
  });

  return NextResponse.json(expense, { status: 201 });
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const { costItemId } = await params;
  const { searchParams } = new URL(req.url);
  const expenseId = searchParams.get("expenseId");
  if (!expenseId) return NextResponse.json({ error: "expenseId required" }, { status: 400 });

  await prisma.projectExpense.deleteMany({ where: { id: expenseId, costItemId } });
  return NextResponse.json({ ok: true });
}
