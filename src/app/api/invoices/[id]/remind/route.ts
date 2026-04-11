import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendReminderEmail } from "@/lib/email";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: {
      client: true,
      project: { select: { id: true, name: true, code: true } },
    },
  });

  if (!invoice) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (invoice.status !== "sent" && invoice.status !== "overdue") {
    return NextResponse.json(
      { error: "Reminders can only be sent for invoices with status sent or overdue" },
      { status: 400 }
    );
  }

  if (!invoice.client.email) {
    return NextResponse.json(
      { error: "no_email", message: "El cliente no tiene email registrado" },
      { status: 422 }
    );
  }

  // 7-day cooldown
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  if (invoice.reminderSentAt && invoice.reminderSentAt > sevenDaysAgo) {
    const nextAllowedAt = new Date(invoice.reminderSentAt);
    nextAllowedAt.setDate(nextAllowedAt.getDate() + 7);
    return NextResponse.json({ error: "cooldown", nextAllowedAt }, { status: 429 });
  }

  await sendReminderEmail(
    {
      id: invoice.id,
      number: invoice.number,
      internalRef: invoice.internalRef,
      issueDate: invoice.issueDate,
      dueDate: invoice.dueDate,
      total: Number(invoice.total),
      description: invoice.description,
    },
    invoice.client,
    invoice.project
  );

  await prisma.invoice.update({
    where: { id },
    data: { reminderSentAt: new Date() },
  });

  const nextAllowedAt = new Date();
  nextAllowedAt.setDate(nextAllowedAt.getDate() + 7);

  return NextResponse.json({ sent: true, nextAllowedAt });
}
