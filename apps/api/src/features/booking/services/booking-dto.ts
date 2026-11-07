import type { bookings, slots } from "@db/booking/schema/index";
import type { db } from "@db/client";
import type { Booking, Slot } from "@hermes/types";

export type SlotRow = typeof slots.$inferSelect;
export type BookingRow = typeof bookings.$inferSelect;
export type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

export const toSlot = (row: SlotRow): Slot => ({
  id: row.id,
  clinicId: row.clinicId,
  startAt: row.startAt.toISOString(),
  endAt: row.endAt.toISOString(),
  kind: row.kind,
  heldByCaseId: row.heldByCaseId,
});

export const toBooking = (row: BookingRow): Booking => ({
  id: row.id,
  caseId: row.caseId,
  slotId: row.slotId,
  status: row.status,
  prepInstructions: row.prepInstructions,
  createdAt: row.createdAt.toISOString(),
});
