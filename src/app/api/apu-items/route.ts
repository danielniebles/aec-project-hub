import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const items = await prisma.aPUItem.findMany({
    where: { active: true },
    include: {
      lines: {
        include: { resource: { include: { prices: { where: { validUntil: null }, take: 1, orderBy: { createdAt: "desc" } } } } },
        orderBy: { order: "asc" },
      },
    },
    orderBy: { code: "asc" },
  });
  return NextResponse.json(items);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const item = await prisma.aPUItem.create({
    data: {
      code: body.code,
      description: body.description,
      outputUnit: body.outputUnit,
      category: body.category,
      aiuAdminPct: body.aiuAdminPct ?? 10,
      aiuContingencyPct: body.aiuContingencyPct ?? 5,
      aiuProfitPct: body.aiuProfitPct ?? 3,
      notes: body.notes ?? null,
    },
  });
  return NextResponse.json(item, { status: 201 });
}
