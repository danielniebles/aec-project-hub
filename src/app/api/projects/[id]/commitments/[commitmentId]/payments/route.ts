import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; commitmentId: string }> }
) {
  const { commitmentId } = await params;
  const body = await req.json();
  const { date, amount, notes } = body;

  if (!date || !amount) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const payment = await prisma.payment.create({
    data: {
      commitmentId,
      date: new Date(date),
      amount,
      notes: notes || null,
    },
  });

  return NextResponse.json(payment, { status: 201 });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; commitmentId: string }> }
) {
  await params;
  const { searchParams } = new URL(req.url);
  const paymentId = searchParams.get("paymentId");
  if (!paymentId) return NextResponse.json({ error: "Missing paymentId" }, { status: 400 });

  await prisma.payment.delete({ where: { id: paymentId } });
  return NextResponse.json({ ok: true });
}
