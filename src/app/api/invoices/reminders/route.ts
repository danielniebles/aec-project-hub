import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendReminderEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const expected = `Bearer ${process.env.CRON_SECRET}`;

  if (!process.env.CRON_SECRET || authHeader !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const threeDaysFromNow = new Date();
  threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const invoices = await prisma.invoice.findMany({
    where: {
      status: "sent",
      dueDate: { lte: threeDaysFromNow },
      OR: [
        { reminderSentAt: null },
        { reminderSentAt: { lt: sevenDaysAgo } },
      ],
    },
    include: {
      client: true,
      project: { select: { id: true, name: true, code: true } },
    },
  });

  let sent = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const invoice of invoices) {
    if (!invoice.client.email) {
      skipped++;
      console.log(`[cron] Skipping invoice ${invoice.number} — client ${invoice.client.name} has no email`);
      continue;
    }

    try {
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
        where: { id: invoice.id },
        data: { reminderSentAt: new Date() },
      });

      sent++;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`Invoice ${invoice.number}: ${msg}`);
      console.error(`[cron] Failed to send reminder for invoice ${invoice.number}:`, err);
    }
  }

  return NextResponse.json({ sent, skipped, errors });
}
