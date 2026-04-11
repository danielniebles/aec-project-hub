type APUItemForCalc = {
  lines: {
    resource: { prices: { price: string }[] };
    quantity: string;
    wasteFactorPct: string;
  }[];
  aiuAdminPct: string;
  aiuContingencyPct: string;
  aiuProfitPct: string;
};

export function computeAPUUnitPrice(item: APUItemForCalc): number {
  const direct = item.lines.reduce((sum, line) => {
    const price = line.resource.prices[0];
    if (!price) return sum;
    return (
      sum +
      Number(price.price) *
        Number(line.quantity) *
        (1 + Number(line.wasteFactorPct) / 100)
    );
  }, 0);
  const aiu =
    (Number(item.aiuAdminPct) +
      Number(item.aiuContingencyPct) +
      Number(item.aiuProfitPct)) /
    100;
  return direct * (1 + aiu);
}
