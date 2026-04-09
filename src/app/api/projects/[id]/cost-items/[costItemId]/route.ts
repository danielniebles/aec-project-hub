import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { computeUnitPrice } from "@/lib/apu";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; costItemId: string }> }
) {
  const { id: projectId, costItemId } = await params;
  const body = await req.json();
  const { apuItemId } = body;

  if (!apuItemId) {
    return NextResponse.json({ error: "apuItemId is required" }, { status: 400 });
  }

  // Ownership check
  const existing = await prisma.costItem.findUnique({ where: { id: costItemId } });
  if (!existing || existing.projectId !== projectId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const apuItem = await prisma.aPUItem.findUnique({ where: { id: apuItemId } });
  if (!apuItem) {
    return NextResponse.json({ error: "APU item not found" }, { status: 404 });
  }

  const unitPrice = await computeUnitPrice(apuItemId);

  const updated = await prisma.costItem.update({
    where: { id: costItemId },
    data: {
      apuItemId,
      resourceId: null,
      description: apuItem.description,
      unit: apuItem.outputUnit,
      unitCostBudgeted: unitPrice,
      notes: `APU asignado. Precio unitario fijado al ${new Date().toLocaleDateString("es-CO")}`,
    },
    include: { apuItem: true, resource: true, commitments: true },
  });

  return NextResponse.json(updated);
}
