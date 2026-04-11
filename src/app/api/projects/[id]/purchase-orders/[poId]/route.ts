import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; poId: string }> }
) {
  const { id, poId } = await params;

  const po = await prisma.purchaseOrder.findFirst({
    where: { id: poId, projectId: id },
  });

  if (!po) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.purchaseOrder.delete({ where: { id: poId } });
  return new NextResponse(null, { status: 204 });
}
