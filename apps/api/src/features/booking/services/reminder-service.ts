import { findCase } from "@api/features/care-loop/services/case-repository";
import {
  listNotifications,
  queueNotification,
} from "@api/features/notify/services/notification-service";
import { bookings, slots } from "@db/booking/schema/index";
import { db } from "@db/client";
import { and, eq, gte, lte } from "drizzle-orm";

// 24h reminder sweep. Runs with the same five-minute tick as the SLA sweep and
// queues exactly one reminder per booking, so a restart cannot spam patients.
export const queueVisitReminders = async (
  now: Date = new Date(),
): Promise<number> => {
  const in24h = new Date(now.getTime() + 24 * 3600 * 1000);
  const rows = await db
    .select({ booking: bookings, slot: slots })
    .from(bookings)
    .innerJoin(slots, eq(bookings.slotId, slots.id))
    .where(
      and(
        eq(bookings.status, "confirmed"),
        gte(slots.startAt, now),
        lte(slots.startAt, in24h),
      ),
    );

  let queued = 0;
  for (const row of rows) {
    const careCase = await findCase(row.booking.caseId);
    if (careCase === null) continue;
    const existing = await listNotifications(careCase.id);
    if (existing.some((item) => item.kind === "visit_reminder")) continue;
    await queueNotification({
      caseId: careCase.id,
      patientId: careCase.patientId,
      channel: "push",
      kind: "visit_reminder",
      payload: {
        appointmentId: row.booking.id,
        startAt: row.slot.startAt.toISOString(),
        kind: row.slot.kind,
        prep: row.booking.prepInstructions,
      },
    });
    queued += 1;
  }
  return queued;
};
