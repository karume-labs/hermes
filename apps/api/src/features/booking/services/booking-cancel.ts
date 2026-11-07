import type { Tx } from "@api/features/booking/services/booking-dto";
import {
  bookInTransaction,
  isUniqueViolation,
} from "@api/features/booking/services/booking-repository";
import {
  ConflictError,
  NotFoundError,
} from "@api/features/shared/errors/index";
import { bookings, slots } from "@db/booking/schema/index";
import { careCases } from "@db/care-loop/schema/index";
import { db } from "@db/client";
import type { Booking } from "@hermes/types";
import { and, eq } from "drizzle-orm";

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
  // Closure releases the booking after setting `closed`; never roll the
  // status back to an in-flight state in that case.
  if (careCase !== undefined && careCase.status !== "closed") {
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
