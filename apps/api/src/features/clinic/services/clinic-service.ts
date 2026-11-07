import type { StaffContext } from "@api/features/shared/auth/index";
import { bookings, slots } from "@db/booking/schema/index";
import { careCases } from "@db/care-loop/schema/index";
import { db } from "@db/client";
import { clinics, patients } from "@db/directory/schema/index";
import type {
  Booking,
  ClinicAppointment,
  ClinicPatient,
  Slot,
} from "@hermes/types";
import { asc, desc, eq, inArray } from "drizzle-orm";

const toSlot = (row: typeof slots.$inferSelect): Slot => ({
  id: row.id,
  clinicId: row.clinicId,
  startAt: row.startAt.toISOString(),
  endAt: row.endAt.toISOString(),
  kind: row.kind,
  heldByCaseId: row.heldByCaseId,
});

const toBooking = (row: typeof bookings.$inferSelect): Booking => ({
  id: row.id,
  caseId: row.caseId,
  slotId: row.slotId,
  status: row.status,
  prepInstructions: row.prepInstructions,
  createdAt: row.createdAt.toISOString(),
});

export const listClinicAppointments = async (
  staff: StaffContext,
): Promise<ClinicAppointment[]> => {
  const rows = await db
    .select({
      booking: bookings,
      slot: slots,
      clinicName: clinics.name,
      patientId: patients.id,
      patientName: patients.name,
      patientPhone: patients.phone,
      caseSummary: careCases.summaryPlainLanguage,
      severity: careCases.severity,
    })
    .from(bookings)
    .innerJoin(slots, eq(bookings.slotId, slots.id))
    .innerJoin(careCases, eq(bookings.caseId, careCases.id))
    .innerJoin(patients, eq(careCases.patientId, patients.id))
    .innerJoin(clinics, eq(slots.clinicId, clinics.id))
    .where(
      staff.clinicId === null ? undefined : eq(slots.clinicId, staff.clinicId),
    )
    .orderBy(asc(slots.startAt))
    .limit(300);
  return rows.map((row) => ({
    booking: toBooking(row.booking),
    slot: toSlot(row.slot),
    clinicName: row.clinicName,
    patientId: row.patientId,
    patientName: row.patientName,
    patientPhone: row.patientPhone,
    caseSummary: row.caseSummary,
    severity: row.severity,
  }));
};

export const listClinicPatients = async (
  staff: StaffContext,
): Promise<ClinicPatient[]> => {
  const patientRows = await db
    .select()
    .from(patients)
    .where(
      staff.clinicId === null
        ? undefined
        : eq(patients.clinicId, staff.clinicId),
    )
    .orderBy(asc(patients.name));
  if (patientRows.length === 0) return [];

  const caseRows = await db
    .select({
      id: careCases.id,
      patientId: careCases.patientId,
      status: careCases.status,
      createdAt: careCases.createdAt,
    })
    .from(careCases)
    .where(
      inArray(
        careCases.patientId,
        patientRows.map((patient) => patient.id),
      ),
    )
    .orderBy(desc(careCases.createdAt));

  return patientRows.map((patient) => {
    const owned = caseRows.filter((row) => row.patientId === patient.id);
    const latest = owned[0];
    return {
      ...patient,
      createdAt: patient.createdAt.toISOString(),
      updatedAt: patient.updatedAt.toISOString(),
      caseCount: owned.length,
      activeCaseCount: owned.filter((row) => row.status !== "closed").length,
      lastCaseId: latest === undefined ? null : latest.id,
      lastCaseAt: latest === undefined ? null : latest.createdAt.toISOString(),
    };
  });
};
