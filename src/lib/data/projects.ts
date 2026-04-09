import { prisma } from "@/lib/prisma";

export type CommitmentStatus = "Pagado" | "Parcial" | "Pendiente";

export type ProjectDetail = Awaited<ReturnType<typeof getProject>>;

export async function getProject(id: string) {
  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      costItems: {
        include: {
          apuItem: {
            include: {
              lines: { include: { resource: true } },
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

  if (!project) return null;

  const costItems = project.costItems.map((item) => {
    const totalBudgeted =
      Number(item.quantityBudgeted) * Number(item.unitCostBudgeted);

    const commitments = item.commitments.map((c) => {
      const totalCommitted = Number(c.totalCommitted);
      const payments = c.payments.map((p) => ({ ...p, amount: Number(p.amount) }));
      const totalPaid = payments.reduce((s, p) => s + p.amount, 0);
      const totalPending = Math.max(0, totalCommitted - totalPaid);
      const status: CommitmentStatus =
        totalPaid === 0
          ? "Pendiente"
          : totalPaid >= totalCommitted
          ? "Pagado"
          : "Parcial";
      return { ...c, totalCommitted, payments, totalPaid, totalPending, status };
    });

    const totalCommitted = commitments.reduce(
      (s, c) => s + Number(c.totalCommitted),
      0
    );
    const totalPaid = commitments.reduce((s, c) => s + c.totalPaid, 0);
    const totalPending = commitments.reduce((s, c) => s + c.totalPending, 0);

    return {
      ...item,
      commitments,
      totalBudgeted,
      totalCommitted,
      totalPaid,
      totalPending,
    };
  });

  const totalPresupuesto = costItems.reduce((s, i) => s + i.totalBudgeted, 0);
  const totalComprometido = costItems.reduce((s, i) => s + i.totalCommitted, 0);
  const totalPagado = costItems.reduce((s, i) => s + i.totalPaid, 0);
  const totalPendiente = costItems.reduce((s, i) => s + i.totalPending, 0);

  return {
    ...project,
    costItems,
    totalPresupuesto,
    totalComprometido,
    totalPagado,
    totalPendiente,
  };
}
