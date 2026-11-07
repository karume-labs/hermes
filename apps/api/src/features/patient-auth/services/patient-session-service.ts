import {
  type PatientContext,
  toProfile,
} from "@api/features/patient-auth/services/patient-auth-dto";
import { hashToken } from "@api/features/patient-auth/services/tokens";
import { env } from "@api/features/shared/env/index";
import { UnauthorizedError } from "@api/features/shared/errors/index";
import { db } from "@db/client";
import { clinics, patients } from "@db/directory/schema/index";
import { patientSessions } from "@db/patient/schema/index";
import { and, eq, gt, isNull } from "drizzle-orm";

export const sessionDays = (): number => Number(env.PATIENT_SESSION_DAYS);

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
