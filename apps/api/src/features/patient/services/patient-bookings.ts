import { toBooking, toSlot } from "@api/features/booking/services/booking-dto";
import { bookings, slots } from "@db/booking/schema/index";
import { careCases } from "@db/care-loop/schema/index";
import { db } from "@db/client";
import { clinics } from "@db/directory/schema/index";
import type { PatientBooking } from "@hermes/types";
import { desc, eq } from "drizzle-orm";

/** Every visit the patient has, including cancelled and past ones. */
export const listPatientBookings = async (
  patientId: string,
): Promise<PatientBooking[]> => {
  const rows = await db
    .select({
      booking: bookings,
      slot: slots,
      clinicName: clinics.name,
      summary: careCases.summaryPlainLanguage,
      severity: careCases.severity,
    })
    .from(bookings)
    .innerJoin(slots, eq(bookings.slotId, slots.id))
    .innerJoin(careCases, eq(bookings.caseId, careCases.id))
    .innerJoin(clinics, eq(careCases.clinicId, clinics.id))
    .where(eq(careCases.patientId, patientId))
    .orderBy(desc(slots.startAt));
  return rows.map((row) => ({
    booking: toBooking(row.booking),
    slot: toSlot(row.slot),
    clinicName: row.clinicName,
    summary: row.summary,
    severity: row.severity,
  }));
};
