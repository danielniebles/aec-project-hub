import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Compute snapshotted unit price from APU item at the moment of adding to project
async function computeUnitPrice(apuItemId: string): Promise<number> {
  const apuItem = await prisma.aPUItem.findUnique({
    where: { id: apuItemId },
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
      },
    },
  });
  if (!apuItem) return 0;

  const directCost = apuItem.lines.reduce((sum, line) => {
    const price = line.resource.prices[0];
    if (!price) return sum;
    const unitPrice = Number(price.price);
    const qty = Number(line.quantity);
    const waste = Number(line.wasteFactorPct) / 100;
    return sum + unitPrice * qty * (1 + waste);
  }, 0);

  const aiuPct =
    (Number(apuItem.aiuAdminPct) +
      Number(apuItem.aiuContingencyPct) +
      Number(apuItem.aiuProfitPct)) /
    100;

  return directCost * (1 + aiuPct);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await params;
  const body = await req.json();

  const apuItem = await prisma.aPUItem.findUnique({ where: { id: body.apuItemId } });
  if (!apuItem) return NextResponse.json({ error: "APU item not found" }, { status: 404 });

  const unitPrice = await computeUnitPrice(body.apuItemId);

  const costItem = await prisma.costItem.create({
    data: {
      projectId,
      apuItemId: body.apuItemId,
      category: "other",
      description: apuItem.description,
      unit: apuItem.outputUnit,
      quantityBudgeted: body.quantity,
      unitCostBudgeted: unitPrice,
      notes: `Precio unitario fijado al ${new Date().toLocaleDateString("es-CO")}`,
    },
    include: { apuItem: true, expenses: true },
  });

  return NextResponse.json(
    {
      ...costItem,
      totalBudgeted: Number(costItem.quantityBudgeted) * Number(costItem.unitCostBudgeted),
      totalExecuted: 0,
      variance: 0,
    },
    { status: 201 }
  );
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await params;
  const { searchParams } = new URL(req.url);
  const costItemId = searchParams.get("costItemId");
  if (!costItemId) return NextResponse.json({ error: "costItemId required" }, { status: 400 });

  await prisma.costItem.deleteMany({ where: { id: costItemId, projectId } });
  return NextResponse.json({ ok: true });
}
