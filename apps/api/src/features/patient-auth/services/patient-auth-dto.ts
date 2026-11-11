import { db } from "@db/client";
import { clinics, patients } from "@db/directory/schema/index";
import { eq } from "drizzle-orm";

export interface PatientProfile {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  /** Null until a clinic admits the patient; set by the clinic link flow. */
  clinicId: string | null;
  clinicName: string | null;
  pushConsent: boolean;
  smsConsent: boolean;
  emailConsent: boolean;
  notificationChannel: "email" | "in_app" | "both";
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
  email: patients.email,
  clinicId: patients.clinicId,
  clinicName: clinics.name,
  pushConsent: patients.pushConsent,
  smsConsent: patients.smsConsent,
  emailConsent: patients.emailConsent,
  notificationChannel: patients.notificationChannel,
};

export const toProfile = (row: PatientProfile): PatientProfile => ({
  id: row.id,
  name: row.name,
  phone: row.phone,
  email: row.email,
  clinicId: row.clinicId,
  clinicName: row.clinicName,
  pushConsent: row.pushConsent,
  smsConsent: row.smsConsent,
  emailConsent: row.emailConsent,
  notificationChannel: row.notificationChannel,
});

// A self-registered patient has no clinic yet, so the join cannot be inner:
// sign-in must work before a clinic has linked them.
export const findPatientByPhone = async (
  phone: string,
): Promise<PatientProfile | null> => {
  const [row] = await db
    .select(profileColumns)
    .from(patients)
    .leftJoin(clinics, eq(patients.clinicId, clinics.id))
    .where(eq(patients.phone, phone))
    .limit(1);
  return row ?? null;
};

export const findPatientProfileById = async (
  id: string,
): Promise<PatientProfile | null> => {
  const [row] = await db
    .select(profileColumns)
    .from(patients)
    .leftJoin(clinics, eq(patients.clinicId, clinics.id))
    .where(eq(patients.id, id))
    .limit(1);
  return row ?? null;
};
