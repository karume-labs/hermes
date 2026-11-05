import {
  ConflictError,
  NotFoundError,
} from "@api/features/shared/errors/index";
import { bookings, slots } from "@db/booking/schema/index";
import { careCases } from "@db/care-loop/schema/index";
import { db } from "@db/client";
import type { Booking, Slot } from "@hermes/types";
import { asc, eq } from "drizzle-orm";

type SlotRow = typeof slots.$inferSelect;
type BookingRow = typeof bookings.$inferSelect;

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

// Three rolling slots per clinic (two in person, one telehealth). Insert is
// idempotent on the primary key so repeated reads never duplicate inventory.
export const ensureSlots = async (clinicId: string): Promise<Slot[]> => {
  const existing = await db
    .select()
    .from(slots)
    .where(eq(slots.clinicId, clinicId))
    .orderBy(asc(slots.startAt));
  if (existing.length > 0) return existing.map(toSlot);

  const now = Date.now();
  const day = 24 * 3600 * 1000;
  const kinds: Array<"in_person" | "telehealth"> = [
    "in_person",
    "in_person",
    "telehealth",
  ];
  const created = kinds.map((kind, index) => ({
    id: `${clinicId}-slot-${index + 1}`,
    clinicId,
    startAt: new Date(now + (index + 1) * day),
    endAt: new Date(now + (index + 1) * day + 30 * 60 * 1000),
    kind,
  }));
  await db.insert(slots).values(created).onConflictDoNothing();
  const rows = await db
    .select()
    .from(slots)
    .where(eq(slots.clinicId, clinicId))
    .orderBy(asc(slots.startAt));
  return rows.map(toSlot);
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
    .where(eq(bookings.caseId, caseId));
  if (row === undefined) return null;
  return toBooking(row);
};

export interface BookSlotInput {
  caseId: string;
  slotId: string;
  kind?: "in_person" | "telehealth";
}

// Row lock on the slot serialises concurrent bookings for the same slot, so
// two patients can never hold the same appointment.
export const bookSlot = async ({
  caseId,
  slotId,
  kind,
}: BookSlotInput): Promise<Booking> => {
  return db.transaction(async (tx) => {
    const [slot] = await tx
      .select()
      .from(slots)
      .where(eq(slots.id, slotId))
      .for("update");
    if (slot === undefined) throw new NotFoundError("Case or slot not found");
    // Any existing hold blocks the slot, including a repeat request from the
    // same case (a case holds at most one appointment).
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
  });
};
