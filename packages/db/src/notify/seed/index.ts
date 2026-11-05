import { careCases } from "@db/care-loop/schema/index";
import { db } from "@db/client";
import { notifications } from "@db/notify/schema/index";
import type { SeedContext } from "@db/seed/types";

// Demo outbox: an unread push for every open case, a read push for acknowledged
// cases and an SMS fallback for escalated ones. Idempotent by emptiness check.
export const seedNotify = async (_context: SeedContext): Promise<number> => {
  const existing = await db
    .select({ id: notifications.id })
    .from(notifications)
    .limit(1);
  if (existing.length > 0) return 0;

  const cases = await db.select().from(careCases);
  if (cases.length === 0) return 0;

  const rows = cases.flatMap((careCase) => {
    const push = {
      caseId: careCase.id,
      patientId: careCase.patientId,
      channel: "push" as const,
      kind: "case_alert" as const,
      status:
        careCase.acknowledgedAt === null
          ? ("sent" as const)
          : ("read" as const),
      payload: {
        severity: careCase.severity,
        summary: careCase.summaryPlainLanguage,
      },
      sentAt: new Date(careCase.createdAt.getTime() + 30_000),
      readAt: careCase.acknowledgedAt,
    };
    if (careCase.status !== "escalated") return [push];
    return [
      push,
      {
        caseId: careCase.id,
        patientId: careCase.patientId,
        channel: "sms" as const,
        kind: "sms_fallback" as const,
        status: "queued" as const,
        payload: { text: "Your screening needs follow-up. Open Hermes Care." },
      },
    ];
  });

  await db.insert(notifications).values(rows);
  return rows.length;
};
