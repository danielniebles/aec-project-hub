import { NextRequest, NextResponse } from "next/server";
import { ResourceType } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") || "";
  const rawType = searchParams.get("type") || "";
  const category = searchParams.get("category") || "";

  const type =
    rawType && Object.values(ResourceType).includes(rawType as ResourceType)
      ? (rawType as ResourceType)
      : undefined;

  const resources = await prisma.resource.findMany({
    where: {
      active: true,
      ...(search && {
        OR: [
          { description: { contains: search, mode: "insensitive" } },
          { code: { contains: search, mode: "insensitive" } },
        ],
      }),
      ...(type && { type }),
      ...(category && { category: { contains: category, mode: "insensitive" } }),
    },
    include: {
      prices: {
        where: { validUntil: null },
        orderBy: { createdAt: "desc" },
      },
    },
    orderBy: { code: "asc" },
  });

  return NextResponse.json(resources);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const resource = await prisma.resource.create({
    data: {
      code: body.code,
      description: body.description,
      unit: body.unit,
      type: body.type,
      category: body.category,
      notes: body.notes ?? null,
    },
  });
  return NextResponse.json(resource, { status: 201 });
}
