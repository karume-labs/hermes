import { describe, expect, test } from "bun:test";
import {
  DASHBOARD_ROLES,
  isDashboardRole,
} from "@/features/auth/services/dashboard-role";

// Regression guard for the lockout where a signed-in clinician was treated as
// having no session and bounced back to /sign-in.
describe("dashboard role gate", () => {
  test("admits a clinician, who may write consult notes and close cases", () => {
    expect(isDashboardRole("clinician")).toBe(true);
    expect(DASHBOARD_ROLES).toContain("clinician");
  });

  test("still admits coordinators and administrators", () => {
    expect(isDashboardRole("coordinator")).toBe(true);
    expect(isDashboardRole("admin")).toBe(true);
  });

  test("refuses roles that are not staff", () => {
    expect(isDashboardRole("patient")).toBe(false);
    expect(isDashboardRole("")).toBe(false);
    expect(isDashboardRole(null)).toBe(false);
    expect(isDashboardRole(undefined)).toBe(false);
    expect(isDashboardRole(42)).toBe(false);
  });
});
