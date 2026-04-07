import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const line = await prisma.aPULine.create({
    data: {
      apuItemId: id,
      resourceId: body.resourceId,
      quantity: body.quantity,
      wasteFactorPct: body.wasteFactorPct ?? 0,
      order: body.order ?? 0,
      notes: body.notes ?? null,
    },
    include: {
      resource: {
        include: {
          prices: { where: { validUntil: null }, take: 1, orderBy: { createdAt: "desc" } },
        },
      },
    },
  });
  return NextResponse.json(line, { status: 201 });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: apuItemId } = await params;
  const { searchParams } = new URL(req.url);
  const lineId = searchParams.get("lineId");
  if (!lineId) return NextResponse.json({ error: "lineId required" }, { status: 400 });

  await prisma.aPULine.deleteMany({ where: { id: lineId, apuItemId } });
  return NextResponse.json({ ok: true });
}
