import { listReferrals } from "@api/features/care-loop/services/referral-service";
import type { StaffContext } from "@api/features/shared/auth/index";
import { bookings, slots } from "@db/booking/schema/index";
import { careCases } from "@db/care-loop/schema/index";
import { db } from "@db/client";
import { clinics, patients } from "@db/directory/schema/index";
import type {
  Booking,
  ClinicAppointment,
  ClinicPatient,
  ClinicReferral,
  Slot,
} from "@hermes/types";
import { asc, desc, eq, inArray } from "drizzle-orm";

const toSlot = (row: typeof slots.$inferSelect): Slot => ({
  id: row.id,
  clinicId: row.clinicId,
  startAt: row.startAt.toISOString(),
  endAt: row.endAt.toISOString(),
  kind: row.kind,
  heldByCaseId: row.heldByCaseId ?? null,
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

export const listClinicReferrals = async (
  staff: StaffContext,
): Promise<ClinicReferral[]> => {
  const referrals = await listReferrals(staff);
  if (referrals.length === 0) return [];

  const caseRows = await db
    .select({
      id: careCases.id,
      patientId: careCases.patientId,
      summary: careCases.summaryPlainLanguage,
    })
    .from(careCases)
    .where(
      inArray(
        careCases.id,
        referrals.map((referral) => referral.caseId),
      ),
    );
  const patientRows = await db
    .select({ id: patients.id, name: patients.name })
    .from(patients)
    .where(
      inArray(
        patients.id,
        caseRows.map((row) => row.patientId),
      ),
    );
  const clinicRows = await db
    .select({ id: clinics.id, name: clinics.name })
    .from(clinics);

  return referrals.flatMap((referral) => {
    const careCase = caseRows.find((row) => row.id === referral.caseId);
    if (careCase === undefined) return [];
    const from = clinicRows.find((row) => row.id === referral.fromClinicId);
    const to = clinicRows.find((row) => row.id === referral.toClinicId);
    const patient = patientRows.find((row) => row.id === careCase.patientId);
    return [
      {
        ...referral,
        patientName: patient?.name ?? careCase.patientId,
        caseSummary: careCase.summary,
        fromClinicName: from?.name ?? referral.fromClinicId,
        toClinicName: to?.name ?? referral.toClinicId,
      },
    ];
  });
};
