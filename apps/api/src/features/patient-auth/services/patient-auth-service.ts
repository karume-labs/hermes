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
  TooManyRequestsError,
  UnauthorizedError,
} from "@api/features/shared/errors/index";
import { db } from "@db/client";
import { clinics, patients } from "@db/directory/schema/index";
import { patientLoginCodes, patientSessions } from "@db/patient/schema/index";
import { and, desc, eq, gt, isNull, lt, sql } from "drizzle-orm";

const MAX_ATTEMPTS = 5;

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
