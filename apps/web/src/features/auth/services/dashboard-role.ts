import type { StaffRole } from "@hermes/types";

/**
 * Which staff roles may open the dashboard. Kept as data so the proxy cannot
 * drift from the roles the API accepts: a clinician signs in like a
 * coordinator and only gains the consult and closure actions.
 */
export const DASHBOARD_ROLES: StaffRole[] = [
  "coordinator",
  "clinician",
  "org_admin",
  "admin",
];

export const isDashboardRole = (value: unknown): value is StaffRole => {
  if (typeof value !== "string") return false;
  return DASHBOARD_ROLES.some((role) => role === value);
};
