import {
  type CodeRequestResult,
  findPatientByPhone,
} from "@api/features/patient-auth/services/patient-auth-dto";
import {
  generateCode,
  hashCode,
  normalizePhone,
} from "@api/features/patient-auth/services/tokens";
import { env } from "@api/features/shared/env/index";
import {
  ServiceUnavailableError,
  TooManyRequestsError,
} from "@api/features/shared/errors/index";
import { db } from "@db/client";
import { patientLoginCodes } from "@db/patient/schema/index";
import { and, eq, gte, isNull } from "drizzle-orm";

export const codeTtlMinutes = (): number =>
  Number(env.PATIENT_CODE_TTL_MINUTES);

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
