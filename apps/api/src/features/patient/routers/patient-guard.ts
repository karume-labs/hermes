import type { PatientContext } from "@api/features/patient-auth/services/patient-auth-dto";
import { requirePatient } from "@api/features/patient-auth/services/patient-session-service";
import { NotFoundError } from "@api/features/shared/errors/index";
import { Type } from "@sinclair/typebox";

export const patientParams = Type.Object({
  patientId: Type.String({ minLength: 1 }),
});

export const caseParams = Type.Object({
  patientId: Type.String({ minLength: 1 }),
  caseId: Type.String({ minLength: 1 }),
});

/**
 * The session decides who the patient is; the path segment only has to match
 * it. A mismatch is reported as 404 so ids cannot be probed.
 */
export const patientFrom = async (
  headers: Record<string, string | undefined>,
  pathPatientId: string,
): Promise<PatientContext> => {
  const context = await requirePatient(headers);
  if (context.patientId !== pathPatientId) {
    throw new NotFoundError("Patient not found");
  }
  return context;
};
