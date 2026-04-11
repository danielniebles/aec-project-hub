import { PrismaClient } from "@prisma/client";

export function computeDueDate(
  issueDate: Date,
  client: { paymentTermType: string; fixedDay?: number | null }
): Date {
  const d = new Date(issueDate);
  if (client.paymentTermType === "net30") {
    d.setDate(d.getDate() + 30);
    return d;
  }
  if (client.paymentTermType === "net60") {
    d.setDate(d.getDate() + 60);
    return d;
  }
  if (client.paymentTermType === "net90") {
    d.setDate(d.getDate() + 90);
    return d;
  }
  // fixed_day: next occurrence of day N after issueDate
  const day = client.fixedDay ?? 10;
  const candidate = new Date(d.getFullYear(), d.getMonth(), day);
  return d.getDate() < day
    ? candidate
    : new Date(d.getFullYear(), d.getMonth() + 1, day);
}

// Generates INT-YYYY-NNN using an atomic upsert to avoid race conditions.
// Must be called inside a Prisma transaction.
export async function generateInternalRef(
  tx: Omit<PrismaClient, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends">,
  year: number
): Promise<string> {
  const result = await tx.$queryRaw<{ last_seq: number }[]>`
    INSERT INTO "InvoiceSequence" (year, "lastSeq")
    VALUES (${year}, 1)
    ON CONFLICT (year) DO UPDATE
      SET "lastSeq" = "InvoiceSequence"."lastSeq" + 1
    RETURNING "lastSeq" AS last_seq
  `;
  const seq = result[0].last_seq;
  return `INT-${year}-${String(seq).padStart(3, "0")}`;
}
