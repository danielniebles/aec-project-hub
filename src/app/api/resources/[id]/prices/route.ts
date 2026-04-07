import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const prices = await prisma.resourcePrice.findMany({
    where: { resourceId: id },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(prices);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const price = await prisma.resourcePrice.create({
    data: {
      resourceId: id,
      sourceType: body.sourceType,
      sourceName: body.sourceName,
      price: body.price,
      currency: body.currency ?? "COP",
      validFrom: new Date(body.validFrom),
      validUntil: body.validUntil ? new Date(body.validUntil) : null,
      notes: body.notes ?? null,
    },
  });
  return NextResponse.json(price, { status: 201 });
}
