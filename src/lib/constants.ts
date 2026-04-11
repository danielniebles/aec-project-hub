import type { Invoice } from "@prisma/client";

export const SUGGEST_EXECUTION_STATUSES: string[] = ["prospect", "design", "permitting"];
export const SUGGEST_CLOSEOUT_STATUSES: string[] = ["execution"];

export function serializeInvoice<
  T extends Pick<Invoice, "subtotal" | "taxPct" | "taxAmount" | "total">,
>(inv: T) {
  return {
    ...inv,
    subtotal: Number(inv.subtotal),
    taxPct: Number(inv.taxPct),
    taxAmount: Number(inv.taxAmount),
    total: Number(inv.total),
  };
}
