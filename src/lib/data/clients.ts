import { prisma } from "@/lib/prisma";

export async function getClients(search?: string) {
  return prisma.client.findMany({
    where: {
      active: true,
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { taxId: { contains: search, mode: "insensitive" } },
              { contactName: { contains: search, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    include: {
      _count: { select: { projects: true, invoices: true } },
    },
    orderBy: { name: "asc" },
  });
}

export async function getClient(id: string) {
  const client = await prisma.client.findUnique({
    where: { id },
    include: {
      projects: {
        select: { id: true, code: true, name: true, status: true, type: true },
        orderBy: { createdAt: "desc" },
      },
      invoices: {
        select: {
          id: true,
          number: true,
          internalRef: true,
          status: true,
          issueDate: true,
          dueDate: true,
          total: true,
          project: { select: { id: true, name: true, code: true } },
        },
        orderBy: { issueDate: "desc" },
      },
      _count: { select: { projects: true, invoices: true } },
    },
  });
  if (!client) return null;
  return {
    ...client,
    invoices: client.invoices.map((inv) => ({ ...inv, total: Number(inv.total) })),
  };
}

export type ClientList = Awaited<ReturnType<typeof getClients>>;
export type ClientDetail = Awaited<ReturnType<typeof getClient>>;
