import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      costItems: {
        include: {
          apuItem: {
              include: {
                lines: {
                  include: { resource: true },
                },
              },
            },
          expenses: true,
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const enriched = {
    ...project,
    costItems: project.costItems.map((item) => {
      const totalBudgeted = Number(item.quantityBudgeted) * Number(item.unitCostBudgeted);
      const totalExecuted = item.expenses.reduce((s, e) => s + Number(e.total), 0);
      return { ...item, totalBudgeted, totalExecuted, variance: totalExecuted - totalBudgeted };
    }),
  };

  return NextResponse.json(enriched);
}
