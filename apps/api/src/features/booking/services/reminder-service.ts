import { findCase } from "@api/features/care-loop/services/case-repository";
import { queueNotification } from "@api/features/notify/services/notification-service";
import { bookings, slots } from "@db/booking/schema/index";
import { db } from "@db/client";
import { notifications } from "@db/notify/schema/index";
import { and, eq, gte, inArray, lte } from "drizzle-orm";

const reminderKey = (caseId: string, appointmentId: string): string =>
  `${caseId}:${appointmentId}`;

const appointmentIdOf = (payload: unknown): string | null => {
  if (payload === null || typeof payload !== "object") return null;
  if (!("appointmentId" in payload)) return null;
  const value = payload.appointmentId;
  return typeof value === "string" && value !== "" ? value : null;
};

// 24h reminder sweep. Runs with the same five-minute tick as the SLA sweep and
// queues exactly one reminder per *booking*, so a rescheduled or follow-up
// visit still gets its own reminder, and a restart cannot spam patients.
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
  if (rows.length === 0) return 0;

  const caseIds = [...new Set(rows.map((row) => row.booking.caseId))];
  const reminders = await db
    .select({
      caseId: notifications.caseId,
      payload: notifications.payload,
    })
    .from(notifications)
    .where(
      and(
        inArray(notifications.caseId, caseIds),
        eq(notifications.kind, "visit_reminder"),
      ),
    );
  const alreadyReminded = new Set(
    reminders
      .map((row) => {
        const appointmentId = appointmentIdOf(row.payload);
        return appointmentId === null
          ? null
          : reminderKey(row.caseId, appointmentId);
      })
      .filter((key): key is string => key !== null),
  );

  let queued = 0;
  for (const row of rows) {
    if (alreadyReminded.has(reminderKey(row.booking.caseId, row.booking.id))) {
      continue;
    }
    const careCase = await findCase(row.booking.caseId);
    if (careCase === null) continue;
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
    alreadyReminded.add(reminderKey(row.booking.caseId, row.booking.id));
    queued += 1;
  }
  return queued;
};
