import { prisma } from "@/lib/prisma";

export async function getInvoices(filters?: {
  clientId?: string;
  projectId?: string;
  status?: string;
  dueBefore?: string;
}) {
  const invoices = await prisma.invoice.findMany({
    where: {
      ...(filters?.clientId && { clientId: filters.clientId }),
      ...(filters?.projectId && { projectId: filters.projectId }),
      ...(filters?.status && { status: filters.status as never }),
      ...(filters?.dueBefore && { dueDate: { lte: new Date(filters.dueBefore) } }),
    },
    include: {
      client: { select: { id: true, name: true } },
      project: { select: { id: true, name: true, code: true } },
      purchaseOrder: { select: { id: true, number: true } },
    },
    orderBy: { issueDate: "desc" },
  });

  return invoices.map((inv) => ({
    ...inv,
    subtotal: Number(inv.subtotal),
    taxPct: Number(inv.taxPct),
    taxAmount: Number(inv.taxAmount),
    total: Number(inv.total),
  }));
}

export type InvoiceList = Awaited<ReturnType<typeof getInvoices>>;
export type InvoiceItem = InvoiceList[number];
