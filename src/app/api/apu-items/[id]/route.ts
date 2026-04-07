import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const item = await prisma.aPUItem.findUnique({
    where: { id },
    include: {
      lines: {
        include: {
          resource: {
            include: {
              prices: {
                where: { validUntil: null },
                orderBy: { createdAt: "desc" },
                take: 1,
              },
            },
          },
        },
        orderBy: { order: "asc" },
      },
    },
  });
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(item);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const item = await prisma.aPUItem.update({
    where: { id },
    data: {
      description: body.description,
      outputUnit: body.outputUnit,
      category: body.category,
      aiuAdminPct: body.aiuAdminPct,
      aiuContingencyPct: body.aiuContingencyPct,
      aiuProfitPct: body.aiuProfitPct,
      notes: body.notes ?? null,
    },
  });
  return NextResponse.json(item);
}
