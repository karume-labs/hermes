import { timingSafeEqual } from "node:crypto";
import { auth } from "@api/features/auth/services/config";
import { env } from "@api/features/shared/env/index";
import { UnauthorizedError } from "@api/features/shared/errors/index";
import type { StaffRole } from "@hermes/types";

export type StaffContext = {
  id: string;
  email: string;
  role: StaffRole;
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
  via: "service",
});

const hasRole = (actual: StaffRole, allowed: StaffRole[]): boolean =>
  allowed.includes(actual);

const isStaffRole = (value: unknown): value is StaffRole =>
  value === "coordinator" || value === "admin";

/**
 * Every staff route runs through here. Two credentials are accepted: the
 * Better Auth session cookie issued by the dashboard, and the shared service
 * secret (`Authorization: Bearer …`) used by scripts and lab-to-lab jobs.
 */
export const requireStaff = async (
  headers: RequestHeaders,
  roles: StaffRole[] = ["coordinator", "admin"],
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

  return {
    id: session.user.id,
    email: session.user.email,
    role,
    via: "session",
  };
};

/** Coordinator write guard shared by cases, ingestion, notify and referrals. */
export const assertCoordinator = async (
  headers: RequestHeaders,
): Promise<void> => {
  await requireStaff(headers, ["coordinator", "admin"]);
};
