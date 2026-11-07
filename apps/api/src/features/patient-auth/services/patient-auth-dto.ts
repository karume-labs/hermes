import { db } from "@db/client";
import { clinics, patients } from "@db/directory/schema/index";
import { eq } from "drizzle-orm";

export interface PatientProfile {
  id: string;
  name: string;
  phone: string;
  clinicId: string;
  clinicName: string;
  pushConsent: boolean;
  smsConsent: boolean;
}

export interface PatientContext {
  sessionId: string;
  patientId: string;
  patient: PatientProfile;
}

export interface CodeRequestResult {
  sent: boolean;
  expiresAt: string;
  /** Only present outside production when no SMS gateway is configured. */
  devCode?: string;
}

export const profileColumns = {
  id: patients.id,
  name: patients.name,
  phone: patients.phone,
  clinicId: patients.clinicId,
  clinicName: clinics.name,
  pushConsent: patients.pushConsent,
  smsConsent: patients.smsConsent,
};

export const toProfile = (row: PatientProfile): PatientProfile => ({
  id: row.id,
  name: row.name,
  phone: row.phone,
  clinicId: row.clinicId,
  clinicName: row.clinicName,
  pushConsent: row.pushConsent,
  smsConsent: row.smsConsent,
});

export const findPatientByPhone = async (
  phone: string,
): Promise<PatientProfile | null> => {
  const [row] = await db
    .select(profileColumns)
    .from(patients)
    .innerJoin(clinics, eq(patients.clinicId, clinics.id))
    .where(eq(patients.phone, phone))
    .limit(1);
  return row ?? null;
};
