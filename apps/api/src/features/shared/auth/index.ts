import type { PatientContext } from "@api/features/patient-auth/services/patient-auth-dto";
import { requirePatient } from "@api/features/patient-auth/services/patient-session-service";
import type {
  RequestHeaders,
  StaffContext,
} from "@api/features/shared/auth/staff-context";
import { requireStaff } from "@api/features/shared/auth/staff-guards";
import { UnauthorizedError } from "@api/features/shared/errors/index";

export * from "@api/features/shared/auth/staff-context";
export * from "@api/features/shared/auth/staff-guards";

/** Either a staff session/API secret or a patient bearer token. */
export type CarePrincipal =
  | {
      kind: "staff";
      staff: import("@api/features/shared/auth/staff-context").StaffContext;
    }
  | { kind: "patient"; patient: PatientContext };

export const requireCarePrincipal = async (
  headers: RequestHeaders,
): Promise<CarePrincipal> => {
  try {
    return { kind: "staff", staff: await requireStaff(headers) };
  } catch (error) {
    if (!(error instanceof UnauthorizedError)) throw error;
  }
  return { kind: "patient", patient: await requirePatient(headers) };
};
