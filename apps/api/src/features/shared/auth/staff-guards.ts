import { auth } from "@api/features/auth/services/config";
import type {
  RequestHeaders,
  StaffContext,
} from "@api/features/shared/auth/staff-context";
import {
  ALL_STAFF,
  hasRole,
  isStaffRole,
  safeEqual,
  serviceContext,
  toHeaders,
} from "@api/features/shared/auth/staff-context";
import { env } from "@api/features/shared/env/index";
import {
  ForbiddenError,
  UnauthorizedError,
} from "@api/features/shared/errors/index";
import type { StaffRole } from "@hermes/types";

/**
 * Every staff route runs through here. Two credentials are accepted: the
 * Better Auth session cookie issued by the dashboard, and the shared service
 * secret (`Authorization: Bearer …`) used by scripts and lab-to-lab jobs.
 */
export const requireStaff = async (
  headers: RequestHeaders,
  roles: StaffRole[] = ALL_STAFF,
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
  const clinicId = session.user.clinicId ?? null;
  const organizationId = session.user.organizationId ?? null;
  // A clinic-bound role without a clinic would otherwise fall through the
  // scoped queries as if it were an admin.
  if (role !== "admin" && role !== "org_admin" && clinicId === null) {
    throw new UnauthorizedError(
      "This account is not assigned to a clinic. Ask an administrator.",
    );
  }
  if (role === "org_admin" && organizationId === null) {
    throw new UnauthorizedError(
      "This account is not assigned to an organization. Ask an administrator.",
    );
  }

  return {
    id: session.user.id,
    email: session.user.email,
    role,
    clinicId,
    organizationId,
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

/** Organization governance: its own org admin, or the platform operator. */
export const requireOrgAdmin = async (
  headers: RequestHeaders,
): Promise<StaffContext> => {
  const staff = await requireStaff(headers, ["org_admin", "admin"]);
  if (staff.role === "org_admin" && staff.organizationId === null) {
    throw new ForbiddenError("This account has no organization.");
  }
  return staff;
};
