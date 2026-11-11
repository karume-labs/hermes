import {
  findPatientByPhone,
  type PatientProfile,
  toProfile,
} from "@api/features/patient-auth/services/patient-auth-dto";
import { sessionDays } from "@api/features/patient-auth/services/patient-session-service";
import {
  generateSessionToken,
  hashToken,
  normalizePhone,
} from "@api/features/patient-auth/services/tokens";
import { ConflictError } from "@api/features/shared/errors/index";
import { db } from "@db/client";
import { patients } from "@db/directory/schema/index";
import { patientSessions } from "@db/patient/schema/index";
import type { NotificationPreference } from "@hermes/types";

export interface VerifyResult {
  token: string;
  expiresAt: string;
  patient: PatientProfile;
}

export const issueSession = async (
  patient: PatientProfile,
): Promise<VerifyResult> => {
  const now = new Date();
  const token = generateSessionToken();
  const expiresAt = new Date(
    now.getTime() + sessionDays() * 24 * 60 * 60 * 1000,
  );
  await db.insert(patientSessions).values({
    patientId: patient.id,
    tokenHash: hashToken(token),
    expiresAt,
  });
  return { token, expiresAt: expiresAt.toISOString(), patient };
};

/**
 * Self-service sign-up. Anyone with a phone number can create an account; the
 * clinic link is made later, when that clinic sends or admits them data. The
 * existing directory row wins so a patient who was already admitted keeps
 * their history instead of getting a second account.
 */
export const registerPatient = async (input: {
  name: string;
  phone: string;
  email?: string;
  notificationChannel?: NotificationPreference;
}): Promise<VerifyResult> => {
  const phone = normalizePhone(input.phone);
  const email = input.email?.trim().toLowerCase();
  const existing = await findPatientByPhone(phone);
  if (existing !== null) {
    throw new ConflictError(
      "That number already has an account. Sign in with a code instead.",
    );
  }

  const channel = input.notificationChannel ?? "in_app";
  const [row] = await db
    .insert(patients)
    .values({
      // A self-registered patient has no clinic id yet: the clinic's own
      // numbering cannot be invented, and the link flow assigns it.
      id: `self-${crypto.randomUUID()}`,
      clinicId: null,
      name: input.name.trim(),
      phone,
      email: email ?? null,
      emailConsent: email !== undefined && channel !== "in_app",
      notificationChannel: channel,
      pushConsent: true,
      selfRegisteredAt: new Date(),
    })
    .returning({
      id: patients.id,
      name: patients.name,
      phone: patients.phone,
      email: patients.email,
      clinicId: patients.clinicId,
      pushConsent: patients.pushConsent,
      smsConsent: patients.smsConsent,
      emailConsent: patients.emailConsent,
      notificationChannel: patients.notificationChannel,
    });
  if (row === undefined) throw new ConflictError("Could not create account.");
  return issueSession(toProfile({ ...row, clinicName: null }));
};
