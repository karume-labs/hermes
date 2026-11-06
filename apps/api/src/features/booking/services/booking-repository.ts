import {
  ConflictError,
  NotFoundError,
} from "@api/features/shared/errors/index";
import { bookings, slots } from "@db/booking/schema/index";
import { careCases } from "@db/care-loop/schema/index";
import { db } from "@db/client";
import type { Booking, Slot } from "@hermes/types";
import { and, asc, eq, gte, inArray } from "drizzle-orm";

type SlotRow = typeof slots.$inferSelect;
type BookingRow = typeof bookings.$inferSelect;
type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

const SLOT_KINDS = [
  { hour: 9, kind: "in_person" },
  { hour: 11, kind: "in_person" },
  { hour: 14, kind: "telehealth" },
] as const;

const SLOT_MINUTES = 30;
const BOOKING_HORIZON_DAYS = 14;

const toSlot = (row: SlotRow): Slot => ({
  id: row.id,
  clinicId: row.clinicId,
  startAt: row.startAt.toISOString(),
  endAt: row.endAt.toISOString(),
  kind: row.kind,
  heldByCaseId: row.heldByCaseId ?? null,
});

const toBooking = (row: BookingRow): Booking => ({
  id: row.id,
  caseId: row.caseId,
  slotId: row.slotId,
  status: row.status,
  prepInstructions: row.prepInstructions,
  createdAt: row.createdAt.toISOString(),
});

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

export const listBookings = async (): Promise<Booking[]> => {
  const rows = await db.select().from(bookings);
  return rows.map(toBooking);
};

export const findBookingByCaseId = async (
  caseId: string,
): Promise<Booking | null> => {
  const [row] = await db
    .select()
    .from(bookings)
    .where(and(eq(bookings.caseId, caseId), eq(bookings.status, "confirmed")))
    .limit(1);
  if (row === undefined) return null;
  return toBooking(row);
};

export const findBooking = async (
  bookingId: string,
): Promise<Booking | null> => {
  const [row] = await db
    .select()
    .from(bookings)
    .where(eq(bookings.id, bookingId))
    .limit(1);
  if (row === undefined) return null;
  return toBooking(row);
};

export interface BookSlotInput {
  caseId: string;
  slotId: string;
  kind?: "in_person" | "telehealth";
}

const isUniqueViolation = (error: unknown): boolean =>
  typeof error === "object" &&
  error !== null &&
  "code" in error &&
  error.code === "23505";

const bookInTransaction = async (
  tx: Tx,
  { caseId, slotId, kind }: BookSlotInput,
): Promise<Booking> => {
  const [careCase] = await tx
    .select()
    .from(careCases)
    .where(eq(careCases.id, caseId))
    .limit(1);
  if (careCase === undefined) throw new NotFoundError("Case not found");
  if (careCase.status === "closed")
    throw new ConflictError("Case already closed");

  const [slot] = await tx
    .select()
    .from(slots)
    .where(eq(slots.id, slotId))
    .for("update");
  if (slot === undefined) throw new NotFoundError("Slot not found");
  if (slot.startAt.getTime() <= Date.now())
    throw new ConflictError("That slot has already passed");
  const allowedClinics = [careCase.clinicId, careCase.referralClinicId];
  if (!allowedClinics.includes(slot.clinicId))
    throw new ConflictError("That slot belongs to another clinic");
  if (slot.heldByCaseId !== null) throw new ConflictError("Slot taken");
  if (kind !== undefined && slot.kind !== kind)
    throw new ConflictError("Slot kind mismatch");

  const [booking] = await tx
    .insert(bookings)
    .values({
      caseId,
      slotId: slot.id,
      status: "confirmed",
      prepInstructions:
        "Bring prior labs, fast 8h if instructed, arrive 15 min early.",
    })
    .returning();

  await tx
    .update(slots)
    .set({ heldByCaseId: caseId })
    .where(eq(slots.id, slot.id));
  await tx
    .update(careCases)
    .set({ status: "appointment_booked", appointmentId: booking.id })
    .where(eq(careCases.id, caseId));

  return toBooking(booking);
};

export const bookSlot = async (input: BookSlotInput): Promise<Booking> => {
  try {
    return await db.transaction(async (tx) => bookInTransaction(tx, input));
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw new ConflictError("This case already has an appointment");
    }
    throw error;
  }
};

const cancelInTransaction = async (
  tx: Tx,
  bookingId: string,
  caseId: string,
): Promise<void> => {
  const [booking] = await tx
    .select()
    .from(bookings)
    .where(eq(bookings.id, bookingId))
    .for("update");
  if (booking === undefined) throw new NotFoundError("Booking not found");
  if (booking.caseId !== caseId) throw new NotFoundError("Booking not found");
  if (booking.status !== "confirmed")
    throw new ConflictError("That appointment is not active");

  await tx
    .update(bookings)
    .set({ status: "cancelled" })
    .where(eq(bookings.id, booking.id));
  await tx
    .update(slots)
    .set({ heldByCaseId: null })
    .where(and(eq(slots.id, booking.slotId), eq(slots.heldByCaseId, caseId)));

  const [careCase] = await tx
    .select()
    .from(careCases)
    .where(eq(careCases.id, caseId))
    .limit(1);
  if (careCase !== undefined) {
    await tx
      .update(careCases)
      .set({
        appointmentId: null,
        status: careCase.acknowledgedAt === null ? "notified" : "acknowledged",
      })
      .where(eq(careCases.id, caseId));
  }
};

export const cancelBooking = async (
  bookingId: string,
  caseId: string,
): Promise<void> => {
  await db.transaction(async (tx) =>
    cancelInTransaction(tx, bookingId, caseId),
  );
};

export interface RescheduleInput {
  bookingId: string;
  caseId: string;
  slotId: string;
  kind?: "in_person" | "telehealth";
}

export const rescheduleBooking = async ({
  bookingId,
  caseId,
  slotId,
  kind,
}: RescheduleInput): Promise<Booking> => {
  try {
    return await db.transaction(async (tx) => {
      await cancelInTransaction(tx, bookingId, caseId);
      return bookInTransaction(tx, { caseId, slotId, kind });
    });
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw new ConflictError("This case already has an appointment");
    }
    throw error;
  }
};

/** Cancelling a case frees any live appointment as part of closure. */
export const releaseCaseBooking = async (caseId: string): Promise<void> => {
  const [booking] = await db
    .select()
    .from(bookings)
    .where(and(eq(bookings.caseId, caseId), eq(bookings.status, "confirmed")))
    .limit(1);
  if (booking === undefined) return;
  await cancelBooking(booking.id, caseId);
};

export const clinicIdsWithBookings = async (): Promise<string[]> => {
  const rows = await db
    .selectDistinct({ clinicId: slots.clinicId })
    .from(bookings)
    .innerJoin(slots, eq(bookings.slotId, slots.id));
  return rows.map((row) => row.clinicId);
};

export const slotsByIds = async (ids: string[]): Promise<Slot[]> => {
  if (ids.length === 0) return [];
  const rows = await db.select().from(slots).where(inArray(slots.id, ids));
  return rows.map(toSlot);
};

/** True when the patient has care at that clinic (home or referred). */
export const patientHasCaseAtClinic = async (
  patientId: string,
  clinicId: string,
): Promise<boolean> => {
  const [row] = await db
    .select({ id: careCases.id })
    .from(careCases)
    .where(
      and(eq(careCases.patientId, patientId), eq(careCases.clinicId, clinicId)),
    )
    .limit(1);
  return row !== undefined;
};
