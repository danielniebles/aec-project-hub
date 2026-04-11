import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const search = req.nextUrl.searchParams.get("search") ?? undefined;
  const activeParam = req.nextUrl.searchParams.get("active");

  const clients = await prisma.client.findMany({
    where: {
      ...(activeParam !== null ? { active: activeParam === "true" } : { active: true }),
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

  return NextResponse.json(clients);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, taxId, email, phone, address, contactName, paymentTermType, fixedDay, notes } = body;

  if (!name) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }

  if (paymentTermType === "fixed_day") {
    const day = Number(fixedDay);
    if (!fixedDay || day < 1 || day > 28) {
      return NextResponse.json(
        { error: "fixedDay must be between 1 and 28 when paymentTermType is fixed_day" },
        { status: 400 }
      );
    }
  }

  const client = await prisma.client.create({
    data: {
      name,
      taxId: taxId || null,
      email: email || null,
      phone: phone || null,
      address: address || null,
      contactName: contactName || null,
      paymentTermType: paymentTermType ?? "net30",
      fixedDay: paymentTermType === "fixed_day" ? Math.min(Number(fixedDay), 28) : null,
      notes: notes || null,
    },
  });

  return NextResponse.json(client, { status: 201 });
}
