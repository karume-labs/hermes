import { timingSafeEqual } from "node:crypto";
import type { StaffRole } from "@hermes/types";

export type StaffContext = {
  id: string;
  email: string;
  role: StaffRole;
  /** Home clinic; null for admins and org admins. */
  clinicId: string | null;
  /** Organization the account belongs to; null for platform admins. */
  organizationId: string | null;
  via: "session" | "service";
};

/** Read scope for a case: clinic, organization or explicit participation. */
export type CaseScope = {
  clinicId: string | null;
  organizationId: string | null;
  userId: string | null;
};

export type RequestHeaders = {
  authorization?: string | undefined;
  cookie?: string | undefined;
};

export const staffScope = (staff: StaffContext): CaseScope => ({
  clinicId: staff.clinicId,
  organizationId: staff.organizationId,
  userId: staff.via === "service" ? null : staff.id,
});

export const safeEqual = (left: string, right: string): boolean => {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
};

export const toHeaders = (headers: RequestHeaders): Headers => {
  const result = new Headers();
  if (headers.cookie !== undefined) result.set("cookie", headers.cookie);
  if (headers.authorization !== undefined) {
    result.set("authorization", headers.authorization);
  }
  return result;
};

export const serviceContext = (): StaffContext => ({
  id: "service",
  email: "service",
  role: "admin",
  clinicId: null,
  organizationId: null,
  via: "service",
});

export const hasRole = (actual: StaffRole, allowed: StaffRole[]): boolean =>
  allowed.includes(actual);

export const isStaffRole = (value: unknown): value is StaffRole =>
  value === "coordinator" ||
  value === "clinician" ||
  value === "org_admin" ||
  value === "admin";

export const ALL_STAFF: StaffRole[] = [
  "coordinator",
  "clinician",
  "org_admin",
  "admin",
];

/**
 * Admins span clinics; a coordinator may only touch their own. Anything
 * outside that boundary is reported as not found so ids cannot be probed.
 */
export const staffCanAccessClinic = (
  staff: StaffContext,
  clinicId: string,
): boolean => staff.role === "admin" || staff.clinicId === clinicId;
