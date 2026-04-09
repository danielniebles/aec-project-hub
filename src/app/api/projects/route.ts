import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const projects = await prisma.project.findMany({
    include: {
      costItems: {
        include: {
          commitments: {
            include: { payments: true },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const result = projects.map((p) => {
    const totalBudgeted = p.costItems.reduce(
      (sum, item) => sum + Number(item.quantityBudgeted) * Number(item.unitCostBudgeted),
      0
    );
    const totalComprometido = p.costItems.reduce(
      (sum, item) => sum + item.commitments.reduce((s, c) => s + Number(c.totalCommitted), 0),
      0
    );
    const totalPagado = p.costItems.reduce(
      (sum, item) => sum + item.commitments.reduce(
        (s, c) => s + c.payments.reduce((ps, pay) => ps + Number(pay.amount), 0), 0
      ),
      0
    );
    return {
      ...p,
      totalBudgeted,
      totalComprometido,
      totalPagado,
      itemCount: p.costItems.length,
    };
  });

  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const project = await prisma.project.create({
    data: {
      name: body.name,
      code: body.code,
      type: body.type,
      status: body.status ?? "prospect",
      location: body.location ?? null,
      startDate: body.startDate ? new Date(body.startDate) : null,
      endDate: body.endDate ? new Date(body.endDate) : null,
      notes: body.notes ?? null,
    },
  });
  return NextResponse.json(project, { status: 201 });
}
