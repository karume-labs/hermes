import { toSlot } from "@api/features/booking/services/booking-dto";
import { bookings, slots } from "@db/booking/schema/index";
import { db } from "@db/client";
import type { Slot } from "@hermes/types";
import { and, asc, eq, gte, inArray } from "drizzle-orm";

const SLOT_KINDS = [
  { hour: 9, kind: "in_person" },
  { hour: 11, kind: "in_person" },
  { hour: 14, kind: "telehealth" },
] as const;

const SLOT_MINUTES = 30;
const BOOKING_HORIZON_DAYS = 14;

const dayKey = (date: Date): string =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

const atHour = (day: Date, hour: number): Date => {
  const value = new Date(day);
  value.setHours(hour, 0, 0, 0);
  return value;
};

/**
 * Rolling availability: three appointments a day per clinic for the next two
 * weeks. Ids are deterministic (`clinic-1-2026-11-07-0900`), so concurrent
 * reads insert the same rows and `onConflictDoNothing` makes this idempotent.
 */
export const ensureSlots = async (
  clinicId: string,
  now: Date = new Date(),
): Promise<Slot[]> => {
  const rows: Array<typeof slots.$inferInsert> = [];
  for (let offset = 0; offset < BOOKING_HORIZON_DAYS; offset += 1) {
    const day = new Date(now);
    day.setDate(day.getDate() + offset);
    for (const pattern of SLOT_KINDS) {
      const startAt = atHour(day, pattern.hour);
      if (startAt.getTime() <= now.getTime()) continue;
      const endAt = new Date(startAt.getTime() + SLOT_MINUTES * 60 * 1000);
      const time = `${String(pattern.hour).padStart(2, "0")}00`;
      rows.push({
        id: `${clinicId}-${dayKey(day)}-${time}`,
        clinicId,
        startAt,
        endAt,
        kind: pattern.kind,
      });
    }
  }
  if (rows.length > 0) {
    await db.insert(slots).values(rows).onConflictDoNothing();
  }

  const future = await db
    .select()
    .from(slots)
    .where(and(eq(slots.clinicId, clinicId), gte(slots.startAt, now)))
    .orderBy(asc(slots.startAt))
    .limit(120);
  return future.map(toSlot);
};

export const findSlot = async (slotId: string): Promise<Slot | null> => {
  const [row] = await db.select().from(slots).where(eq(slots.id, slotId));
  if (row === undefined) return null;
  return toSlot(row);
};

export const slotsByIds = async (ids: string[]): Promise<Slot[]> => {
  if (ids.length === 0) return [];
  const rows = await db.select().from(slots).where(inArray(slots.id, ids));
  return rows.map(toSlot);
};

export const clinicIdsWithBookings = async (): Promise<string[]> => {
  const rows = await db
    .selectDistinct({ clinicId: slots.clinicId })
    .from(bookings)
    .innerJoin(slots, eq(bookings.slotId, slots.id));
  return rows.map((row) => row.clinicId);
};
