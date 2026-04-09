import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { computeUnitPrice } from "@/lib/apu";
import { CostCategory, ResourceType } from "@prisma/client";

const RESOURCE_TYPE_TO_CATEGORY: Record<ResourceType, CostCategory> = {
  material: "materials",
  labor: "labor",
  equipment: "equipment",
  transport: "transport",
  subcontract: "subcontractor",
};

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await params;
  const body = await req.json();

  // Backwards-compatible: no mode + apuItemId present → treat as "apu"
  const mode: string = body.mode ?? (body.apuItemId ? "apu" : "manual");

  if (mode === "apu") {
    const apuItem = await prisma.aPUItem.findUnique({
      where: { id: body.apuItemId },
    });
    if (!apuItem)
      return NextResponse.json({ error: "APU item not found" }, { status: 404 });

    const unitPrice = await computeUnitPrice(body.apuItemId);

    const costItem = await prisma.costItem.create({
      data: {
        projectId,
        apuItemId: body.apuItemId,
        resourceId: null,
        category: "other",
        description: apuItem.description,
        unit: apuItem.outputUnit,
        quantityBudgeted: body.quantity,
        unitCostBudgeted: unitPrice,
        notes: `Precio unitario fijado al ${new Date().toLocaleDateString("es-CO")}`,
      },
      include: { apuItem: true, resource: true, commitments: true },
    });

    return NextResponse.json(
      {
        ...costItem,
        totalBudgeted:
          Number(costItem.quantityBudgeted) * Number(costItem.unitCostBudgeted),
        totalCommitted: 0,
        totalPaid: 0,
        totalPending: 0,
      },
      { status: 201 }
    );
  }

  if (mode === "resource") {
    if (!body.resourceId || !body.quantity) {
      return NextResponse.json(
        { error: "resourceId and quantity are required" },
        { status: 400 }
      );
    }

    const resource = await prisma.resource.findUnique({
      where: { id: body.resourceId },
      include: {
        prices: {
          where: { validUntil: null },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });
    if (!resource)
      return NextResponse.json({ error: "Resource not found" }, { status: 404 });

    const latestPrice = resource.prices[0];
    const unitCostBudgeted = latestPrice ? Number(latestPrice.price) : 0;
    const category = RESOURCE_TYPE_TO_CATEGORY[resource.type];

    const costItem = await prisma.costItem.create({
      data: {
        projectId,
        apuItemId: null,
        resourceId: resource.id,
        category,
        description: resource.description,
        unit: resource.unit,
        quantityBudgeted: body.quantity,
        unitCostBudgeted,
        notes: latestPrice
          ? `Precio unitario fijado al ${new Date().toLocaleDateString("es-CO")}`
          : "Sin precio registrado al momento de creación",
      },
      include: { apuItem: true, resource: true, commitments: true },
    });

    return NextResponse.json(
      {
        ...costItem,
        totalBudgeted:
          Number(costItem.quantityBudgeted) * Number(costItem.unitCostBudgeted),
        totalCommitted: 0,
        totalPaid: 0,
        totalPending: 0,
      },
      { status: 201 }
    );
  }

  // mode === "manual"
  const { description, unit, quantity, unitCost, category } = body;
  if (!description || !unit || !quantity) {
    return NextResponse.json(
      { error: "description, unit, and quantity are required" },
      { status: 400 }
    );
  }

  const costItem = await prisma.costItem.create({
    data: {
      projectId,
      apuItemId: null,
      resourceId: null,
      category: category ?? "other",
      description,
      unit,
      quantityBudgeted: quantity,
      unitCostBudgeted: unitCost ?? 0,
    },
    include: { apuItem: true, resource: true, commitments: true },
  });

  return NextResponse.json(
    {
      ...costItem,
      totalBudgeted:
        Number(costItem.quantityBudgeted) * Number(costItem.unitCostBudgeted),
      totalCommitted: 0,
      totalPaid: 0,
      totalPending: 0,
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
  if (!costItemId)
    return NextResponse.json({ error: "costItemId required" }, { status: 400 });

  await prisma.costItem.deleteMany({ where: { id: costItemId, projectId } });
  return NextResponse.json({ ok: true });
}
