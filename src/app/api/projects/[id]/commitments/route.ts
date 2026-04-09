import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await params;
  const body = await req.json();
  const { costItemId, resourceId, description, date, totalCommitted, notes, fullyPaid, paidDate } = body;

  if (!costItemId || !description || !date || !totalCommitted) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const commitment = await prisma.commitment.create({
    data: {
      projectId,
      costItemId,
      resourceId: resourceId || null,
      description,
      date: new Date(date),
      totalCommitted,
      notes: notes || null,
      ...(fullyPaid
        ? {
            payments: {
              create: {
                date: new Date(paidDate ?? date),
                amount: totalCommitted,
              },
            },
          }
        : {}),
    },
    include: { payments: true, resource: true },
  });

  return NextResponse.json(commitment, { status: 201 });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await params;
  const { searchParams } = new URL(req.url);
  const commitmentId = searchParams.get("commitmentId");
  if (!commitmentId) return NextResponse.json({ error: "Missing commitmentId" }, { status: 400 });

  await prisma.commitment.delete({ where: { id: commitmentId } });
  return NextResponse.json({ ok: true });
}
