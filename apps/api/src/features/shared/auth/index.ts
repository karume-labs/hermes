import { timingSafeEqual } from "node:crypto";
import { auth } from "@api/features/auth/services/config";
import type { PatientContext } from "@api/features/patient-auth/services/patient-auth-dto";
import { requirePatient } from "@api/features/patient-auth/services/patient-session-service";
import { env } from "@api/features/shared/env/index";
import { UnauthorizedError } from "@api/features/shared/errors/index";
import type { StaffRole } from "@hermes/types";

export type StaffContext = {
  id: string;
  email: string;
  role: StaffRole;
  /** Home clinic; null for admins, who may read every clinic. */
  clinicId: string | null;
  via: "session" | "service";
};

export type RequestHeaders = {
  authorization?: string | undefined;
  cookie?: string | undefined;
};

const safeEqual = (left: string, right: string): boolean => {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
};

const toHeaders = (headers: RequestHeaders): Headers => {
  const result = new Headers();
  if (headers.cookie !== undefined) result.set("cookie", headers.cookie);
  if (headers.authorization !== undefined) {
    result.set("authorization", headers.authorization);
  }
  return result;
};

const serviceContext = (): StaffContext => ({
  id: "service",
  email: "service",
  role: "admin",
  clinicId: null,
  via: "service",
});

const hasRole = (actual: StaffRole, allowed: StaffRole[]): boolean =>
  allowed.includes(actual);

const isStaffRole = (value: unknown): value is StaffRole =>
  value === "coordinator" || value === "clinician" || value === "admin";

/**
 * Every staff route runs through here. Two credentials are accepted: the
 * Better Auth session cookie issued by the dashboard, and the shared service
 * secret (`Authorization: Bearer …`) used by scripts and lab-to-lab jobs.
 */
export const requireStaff = async (
  headers: RequestHeaders,
  roles: StaffRole[] = ["coordinator", "clinician", "admin"],
): Promise<StaffContext> => {
  if (
    headers.authorization !== undefined &&
    safeEqual(headers.authorization, `Bearer ${env.API_SECRET}`)
  ) {
    const context = serviceContext();
    if (!hasRole(context.role, roles)) throw new UnauthorizedError();
    return context;
  }

  const session = await auth.api.getSession({ headers: toHeaders(headers) });
  if (session === null) throw new UnauthorizedError("Sign in to continue");

  const { role } = session.user;
  if (!isStaffRole(role)) throw new UnauthorizedError("Not permitted");
  if (!hasRole(role, roles)) throw new UnauthorizedError("Not permitted");
  // A clinic-bound role without a clinic would otherwise fall through the
  // scoped queries as if it were an admin.
  const clinicId = session.user.clinicId ?? null;
  if (role !== "admin" && clinicId === null) {
    throw new UnauthorizedError(
      "This account is not assigned to a clinic. Ask an administrator.",
    );
  }

  return {
    id: session.user.id,
    email: session.user.email,
    role,
    clinicId,
    via: "session",
  };
};

/** Care-team write guard shared by cases, ingestion, notify and referrals. */
export const assertCoordinator = async (
  headers: RequestHeaders,
): Promise<StaffContext> =>
  requireStaff(headers, ["coordinator", "clinician", "admin"]);

/** Only a clinician or admin may sign a case closed. */
export const assertClinician = async (
  headers: RequestHeaders,
): Promise<StaffContext> => requireStaff(headers, ["clinician", "admin"]);

/** Admin-only guard for staff management, webhook logs and tenant settings. */
export const requireAdmin = async (
  headers: RequestHeaders,
): Promise<StaffContext> => requireStaff(headers, ["admin"]);

/**
 * Admins span clinics; a coordinator may only touch their own. Anything
 * outside that boundary is reported as not found so ids cannot be probed.
 */
export const staffCanAccessClinic = (
  staff: StaffContext,
  clinicId: string,
): boolean => staff.role === "admin" || staff.clinicId === clinicId;

/** Either a staff session/API secret or a patient bearer token. */
export type CarePrincipal =
  | { kind: "staff"; staff: StaffContext }
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
