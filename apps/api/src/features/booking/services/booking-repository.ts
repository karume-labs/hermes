import {
  type BookingRow,
  type Tx,
  toBooking,
} from "@api/features/booking/services/booking-dto";
import {
  ConflictError,
  NotFoundError,
} from "@api/features/shared/errors/index";
import { bookings, slots } from "@db/booking/schema/index";
import { careCases } from "@db/care-loop/schema/index";
import { db } from "@db/client";
import type { Booking } from "@hermes/types";
import { and, eq } from "drizzle-orm";

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

export const isUniqueViolation = (error: unknown): boolean =>
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

  const [booking]: BookingRow[] = await tx
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

export { bookInTransaction };

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
