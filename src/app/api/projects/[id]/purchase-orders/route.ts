import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const SUGGEST_EXECUTION_STATUSES = ["prospect", "design", "permitting"];

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const pos = await prisma.purchaseOrder.findMany({
    where: { projectId: id },
    include: { client: { select: { id: true, name: true } } },
    orderBy: { issueDate: "desc" },
  });

  return NextResponse.json(pos);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const { number, clientId, amount, issueDate, notes } = body;

  if (!number || !clientId || !amount || !issueDate) {
    return NextResponse.json(
      { error: "number, clientId, amount, and issueDate are required" },
      { status: 400 }
    );
  }

  const project = await prisma.project.findUnique({ where: { id } });
  if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

  const purchaseOrder = await prisma.purchaseOrder.create({
    data: {
      number,
      clientId,
      projectId: id,
      amount,
      issueDate: new Date(issueDate),
      notes: notes || null,
    },
    include: { client: { select: { id: true, name: true } } },
  });

  const suggestedStatus = SUGGEST_EXECUTION_STATUSES.includes(project.status)
    ? "execution"
    : null;

  return NextResponse.json({ purchaseOrder, suggestedStatus }, { status: 201 });
}
