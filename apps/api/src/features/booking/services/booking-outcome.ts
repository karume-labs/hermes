import { toBooking } from "@api/features/booking/services/booking-dto";
import { ConflictError } from "@api/features/shared/errors/index";
import { bookings, slots } from "@db/booking/schema/index";
import { db } from "@db/client";
import type { Booking } from "@hermes/types";
import { and, eq } from "drizzle-orm";

/** Record the clinic's outcome for a confirmed visit after it has started. */
export const recordBookingOutcome = async (
  clinicId: string | null,
  bookingId: string,
  status: "attended" | "no_show",
): Promise<Booking | null> => {
  const [row] = await db
    .select({ booking: bookings, slot: slots })
    .from(bookings)
    .innerJoin(slots, eq(bookings.slotId, slots.id))
    .where(
      and(
        eq(bookings.id, bookingId),
        clinicId === null ? undefined : eq(slots.clinicId, clinicId),
      ),
    )
    .limit(1);
  if (row === undefined) return null;
  if (row.booking.status !== "confirmed") {
    throw new ConflictError("Only a confirmed visit can be marked");
  }
  if (row.slot.startAt.getTime() > Date.now()) {
    throw new ConflictError("Record the outcome after the visit starts");
  }

  const [updated] = await db
    .update(bookings)
    .set({ status })
    .where(eq(bookings.id, bookingId))
    .returning();
  if (updated === undefined) return null;
  await db
    .update(slots)
    .set({ heldByCaseId: null })
    .where(eq(slots.id, row.slot.id));
  return toBooking(updated);
};
