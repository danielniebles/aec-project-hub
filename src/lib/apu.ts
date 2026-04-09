import { prisma } from "@/lib/prisma";

export async function computeUnitPrice(apuItemId: string): Promise<number> {
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
    return (
      sum +
      Number(price.price) *
        Number(line.quantity) *
        (1 + Number(line.wasteFactorPct) / 100)
    );
  }, 0);

  const aiuPct =
    (Number(apuItem.aiuAdminPct) +
      Number(apuItem.aiuContingencyPct) +
      Number(apuItem.aiuProfitPct)) /
    100;

  return directCost * (1 + aiuPct);
}
