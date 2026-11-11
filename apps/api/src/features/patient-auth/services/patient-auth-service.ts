import {
  findPatientByPhone,
  type PatientProfile,
  toProfile,
} from "@api/features/patient-auth/services/patient-auth-dto";
import { sessionDays } from "@api/features/patient-auth/services/patient-session-service";
import {
  generateSessionToken,
  hashCode,
  hashToken,
  normalizePhone,
  safeEqual,
} from "@api/features/patient-auth/services/tokens";
import {
  ConflictError,
  TooManyRequestsError,
  UnauthorizedError,
} from "@api/features/shared/errors/index";
import { db } from "@db/client";
import { patients } from "@db/directory/schema/index";
import { patientLoginCodes, patientSessions } from "@db/patient/schema/index";
import type { NotificationPreference } from "@hermes/types";
import { and, desc, eq, gt, isNull, lt, sql } from "drizzle-orm";

const MAX_ATTEMPTS = 5;

export interface VerifyResult {
  token: string;
  expiresAt: string;
  patient: PatientProfile;
}

const issueSession = async (patient: PatientProfile): Promise<VerifyResult> => {
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

export const verifyPatientCode = async (
  phoneInput: string,
  code: string,
): Promise<VerifyResult> => {
  const phone = normalizePhone(phoneInput);
  const patient = await findPatientByPhone(phone);
  if (patient === null) throw new UnauthorizedError("That code is not valid.");

  const [row] = await db
    .select()
    .from(patientLoginCodes)
    .where(
      and(
        eq(patientLoginCodes.patientId, patient.id),
        isNull(patientLoginCodes.consumedAt),
        gt(patientLoginCodes.expiresAt, new Date()),
      ),
    )
    .orderBy(desc(patientLoginCodes.createdAt))
    .limit(1);
  if (row === undefined) throw new UnauthorizedError("That code is not valid.");
  if (row.attempts >= MAX_ATTEMPTS)
    throw new TooManyRequestsError(
      0,
      "This code has been entered too many times. Ask for a new code to continue.",
    );

  if (!safeEqual(row.codeHash, hashCode(patient.id, code))) {
    // Increment in SQL, not from the value we read: parallel guesses would
    // otherwise overwrite each other and outrun the five-attempt cap.
    const [bumped] = await db
      .update(patientLoginCodes)
      .set({ attempts: sql`${patientLoginCodes.attempts} + 1` })
      .where(
        and(
          eq(patientLoginCodes.id, row.id),
          lt(patientLoginCodes.attempts, MAX_ATTEMPTS),
        ),
      )
      .returning({ attempts: patientLoginCodes.attempts });
    if (bumped !== undefined && bumped.attempts >= MAX_ATTEMPTS) {
      throw new TooManyRequestsError(
        0,
        "This code has been entered too many times. Ask for a new code to continue.",
      );
    }
    throw new UnauthorizedError("That code is not valid.");
  }

  await db
    .update(patientLoginCodes)
    .set({ consumedAt: new Date() })
    .where(eq(patientLoginCodes.id, row.id));

  return issueSession(patient);
};

export const updatePatientPreferences = async (
  patientId: string,
  input: {
    pushConsent: boolean;
    smsConsent: boolean;
    emailConsent?: boolean;
    notificationChannel?: NotificationPreference;
  },
): Promise<PatientProfile> => {
  const [row] = await db
    .update(patients)
    .set({
      pushConsent: input.pushConsent,
      smsConsent: input.smsConsent,
      ...(input.emailConsent === undefined
        ? {}
        : { emailConsent: input.emailConsent }),
      ...(input.notificationChannel === undefined
        ? {}
        : { notificationChannel: input.notificationChannel }),
    })
    .where(eq(patients.id, patientId))
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
  if (row === undefined) throw new UnauthorizedError();
  const profile = await findPatientByPhone(row.phone);
  return toProfile(profile ?? { ...row, clinicName: null });
};
