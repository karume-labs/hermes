import { env } from "@api/features/shared/env/index";
import {
  ServiceUnavailableError,
  TooManyRequestsError,
  UnauthorizedError,
} from "@api/features/shared/errors/index";
import { db } from "@db/client";
import { clinics, patients } from "@db/directory/schema/index";
import { patientLoginCodes, patientSessions } from "@db/patient/schema/index";
import { and, desc, eq, gt, gte, isNull } from "drizzle-orm";
import {
  generateCode,
  generateSessionToken,
  hashCode,
  hashToken,
  normalizePhone,
  safeEqual,
} from "./tokens";

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

const codeTtlMinutes = (): number => Number(env.PATIENT_CODE_TTL_MINUTES);
const sessionDays = (): number => Number(env.PATIENT_SESSION_DAYS);

const profileColumns = {
  id: patients.id,
  name: patients.name,
  phone: patients.phone,
  clinicId: patients.clinicId,
  clinicName: clinics.name,
  pushConsent: patients.pushConsent,
  smsConsent: patients.smsConsent,
};

const findPatientByPhone = async (phone: string) => {
  const [row] = await db
    .select(profileColumns)
    .from(patients)
    .innerJoin(clinics, eq(patients.clinicId, clinics.id))
    .where(eq(patients.phone, phone))
    .limit(1);
  return row ?? null;
};

const sendCodeSms = async (to: string, code: string): Promise<boolean> => {
  if (env.SMS_WEBHOOK_URL === "") return false;
  try {
    const response = await fetch(env.SMS_WEBHOOK_URL, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        to,
        text: `Hermes: your sign-in code is ${code}. It expires in ${codeTtlMinutes()} minutes. Do not share it.`,
      }),
      signal: AbortSignal.timeout(8_000),
    });
    if (!response.ok) {
      throw new ServiceUnavailableError("Could not send the sign-in code.");
    }
    return true;
  } catch (error) {
    if (error instanceof ServiceUnavailableError) throw error;
    throw new ServiceUnavailableError("Could not send the sign-in code.");
  }
};

// Enumeration-safe: an unknown number gets the same shape of response and no
// code row is created.
export const requestPatientCode = async (
  phoneInput: string,
): Promise<CodeRequestResult> => {
  const phone = normalizePhone(phoneInput);
  const now = new Date();
  const expiresAt = new Date(
    now.getTime() + codeTtlMinutes() * 60 * 1000,
  ).toISOString();
  const patient = await findPatientByPhone(phone);
  if (patient === null) return { sent: true, expiresAt };

  const windowStart = new Date(now.getTime() - 10 * 60 * 1000);
  const recent = await db
    .select({ id: patientLoginCodes.id })
    .from(patientLoginCodes)
    .where(
      and(
        eq(patientLoginCodes.patientId, patient.id),
        gte(patientLoginCodes.createdAt, windowStart),
      ),
    )
    .limit(3);
  if (recent.length >= 3) throw new TooManyRequestsError();

  // Only one live code per patient: requesting again invalidates the old one.
  await db
    .update(patientLoginCodes)
    .set({ consumedAt: now })
    .where(
      and(
        eq(patientLoginCodes.patientId, patient.id),
        isNull(patientLoginCodes.consumedAt),
      ),
    );

  const code = generateCode();
  await db.insert(patientLoginCodes).values({
    patientId: patient.id,
    codeHash: hashCode(patient.id, code),
    expiresAt: new Date(expiresAt),
  });

  const delivered = await sendCodeSms(phone, code);
  if (!delivered && env.NODE_ENV === "production") {
    throw new ServiceUnavailableError(
      "Sign-in by SMS is not available yet. Contact your clinic.",
    );
  }
  return delivered
    ? { sent: true, expiresAt }
    : { sent: true, expiresAt, devCode: code };
};

const toProfile = (row: {
  id: string;
  name: string;
  phone: string;
  clinicId: string;
  clinicName: string;
  pushConsent: boolean;
  smsConsent: boolean;
}): PatientProfile => ({
  id: row.id,
  name: row.name,
  phone: row.phone,
  clinicId: row.clinicId,
  clinicName: row.clinicName,
  pushConsent: row.pushConsent,
  smsConsent: row.smsConsent,
});

export interface VerifyResult {
  token: string;
  expiresAt: string;
  patient: PatientProfile;
}

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
  if (row.attempts >= 5) throw new TooManyRequestsError();

  if (!safeEqual(row.codeHash, hashCode(patient.id, code))) {
    await db
      .update(patientLoginCodes)
      .set({ attempts: row.attempts + 1 })
      .where(eq(patientLoginCodes.id, row.id));
    throw new UnauthorizedError("That code is not valid.");
  }

  const now = new Date();
  await db
    .update(patientLoginCodes)
    .set({ consumedAt: now })
    .where(eq(patientLoginCodes.id, row.id));

  const token = generateSessionToken();
  const expiresAt = new Date(
    now.getTime() + sessionDays() * 24 * 60 * 60 * 1000,
  );
  await db.insert(patientSessions).values({
    patientId: patient.id,
    tokenHash: hashToken(token),
    expiresAt,
  });

  return {
    token,
    expiresAt: expiresAt.toISOString(),
    patient: toProfile(patient),
  };
};

export const parseBearerToken = (authorization?: string): string | null => {
  if (authorization === undefined) return null;
  const [scheme, value] = authorization.split(" ");
  if (scheme !== "Bearer" || value === undefined || value === "") return null;
  return value;
};

export const patientForToken = async (
  token: string,
): Promise<PatientContext | null> => {
  const [row] = await db
    .select({
      sessionId: patientSessions.id,
      patientId: patientSessions.patientId,
      id: patients.id,
      name: patients.name,
      phone: patients.phone,
      clinicId: patients.clinicId,
      clinicName: clinics.name,
      pushConsent: patients.pushConsent,
      smsConsent: patients.smsConsent,
    })
    .from(patientSessions)
    .innerJoin(patients, eq(patientSessions.patientId, patients.id))
    .innerJoin(clinics, eq(patients.clinicId, clinics.id))
    .where(
      and(
        eq(patientSessions.tokenHash, hashToken(token)),
        isNull(patientSessions.revokedAt),
        gt(patientSessions.expiresAt, new Date()),
      ),
    )
    .limit(1);
  if (row === undefined) return null;

  await db
    .update(patientSessions)
    .set({ lastUsedAt: new Date() })
    .where(eq(patientSessions.id, row.sessionId));

  return {
    sessionId: row.sessionId,
    patientId: row.patientId,
    patient: toProfile(row),
  };
};

export const requirePatient = async (headers: {
  authorization?: string | undefined;
}): Promise<PatientContext> => {
  const token = parseBearerToken(headers.authorization);
  if (token === null) throw new UnauthorizedError("Sign in to continue");
  const context = await patientForToken(token);
  if (context === null) {
    throw new UnauthorizedError("Your session expired. Sign in again.");
  }
  return context;
};

export const revokePatientToken = async (token: string): Promise<void> => {
  await db
    .update(patientSessions)
    .set({ revokedAt: new Date() })
    .where(eq(patientSessions.tokenHash, hashToken(token)));
};

export const updatePatientConsent = async (
  patientId: string,
  pushConsent: boolean,
  smsConsent: boolean,
): Promise<PatientProfile> => {
  const [row] = await db
    .update(patients)
    .set({ pushConsent, smsConsent })
    .where(eq(patients.id, patientId))
    .returning({
      id: patients.id,
      name: patients.name,
      phone: patients.phone,
      clinicId: patients.clinicId,
      pushConsent: patients.pushConsent,
      smsConsent: patients.smsConsent,
    });
  if (row === undefined) throw new UnauthorizedError();
  const clinic = await db
    .select({ name: clinics.name })
    .from(clinics)
    .where(eq(clinics.id, row.clinicId))
    .limit(1);
  return toProfile({
    ...row,
    clinicName: clinic[0]?.name ?? row.clinicId,
  });
};
