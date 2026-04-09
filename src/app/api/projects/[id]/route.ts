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
          commitments: {
            include: {
              payments: { orderBy: { date: "asc" } },
              resource: true,
            },
            orderBy: { date: "desc" },
          },
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

      const commitments = item.commitments.map((c) => {
        const totalPaid = c.payments.reduce((s, p) => s + Number(p.amount), 0);
        const totalPending = Math.max(0, Number(c.totalCommitted) - totalPaid);
        const status =
          totalPaid === 0 ? "Pendiente"
          : totalPaid >= Number(c.totalCommitted) ? "Pagado"
          : "Parcial";
        return { ...c, totalPaid, totalPending, status };
      });

      const totalCommitted = commitments.reduce((s, c) => s + Number(c.totalCommitted), 0);
      const totalPaid = commitments.reduce((s, c) => s + c.totalPaid, 0);
      const totalPending = commitments.reduce((s, c) => s + c.totalPending, 0);

      return { ...item, commitments, totalBudgeted, totalCommitted, totalPaid, totalPending };
    }),
  };

  const totalPresupuesto = enriched.costItems.reduce((s, i) => s + i.totalBudgeted, 0);
  const totalComprometido = enriched.costItems.reduce((s, i) => s + i.totalCommitted, 0);
  const totalPagado = enriched.costItems.reduce((s, i) => s + i.totalPaid, 0);
  const totalPendiente = enriched.costItems.reduce((s, i) => s + i.totalPending, 0);

  return NextResponse.json({ ...enriched, totalPresupuesto, totalComprometido, totalPagado, totalPendiente });
}
