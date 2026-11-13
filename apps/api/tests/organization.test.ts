import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import {
  assertOrgClinic,
  createOrganizationClinic,
  listOrganizationClinics,
} from "@api/features/organization/services/organization-clinic-service";
import {
  createOrganization,
  listOrganizations,
  organizationFor,
} from "@api/features/organization/services/organization-service";
import type { StaffContext } from "@api/features/shared/auth/index";
import { db } from "@db/client";
import { clinics, organizations } from "@db/directory/schema/index";
import { inArray } from "drizzle-orm";

const suffix = `${Date.now()}`;
const orgA = `itest-org-a-${suffix}`;
const orgB = `itest-org-b-${suffix}`;
const clinicA = `itest-clinic-a-${suffix}`;
const clinicB = `itest-clinic-b-${suffix}`;

const orgAdmin: StaffContext = {
  id: `itest-org-admin-${suffix}`,
  email: `org-admin-${suffix}@hermescare.test`,
  role: "org_admin",
  clinicId: null,
  organizationId: orgA,
  via: "session",
};

const platformAdmin: StaffContext = {
  id: "service",
  email: "service",
  role: "admin",
  clinicId: null,
  organizationId: null,
  via: "service",
};

describe("organizations", () => {
  beforeAll(async () => {
    await createOrganization({ id: orgA, name: `Test Org A ${suffix}` });
    await createOrganization({ id: orgB, name: `Test Org B ${suffix}` });
    await createOrganizationClinic(orgA, { id: clinicA, name: "Clinic A" });
    await createOrganizationClinic(orgB, { id: clinicB, name: "Clinic B" });
  });

  afterAll(async () => {
    await db
      .delete(clinics)
      .where(inArray(clinics.organizationId, [orgA, orgB]));
    await db
      .delete(organizations)
      .where(inArray(organizations.id, [orgA, orgB]));
  });

  test("clinics are listed only under the organization that owns them", async () => {
    const a = await listOrganizationClinics(orgA);
    const b = await listOrganizationClinics(orgB);
    expect(a.map((clinic) => clinic.id)).toEqual([clinicA]);
    expect(b.map((clinic) => clinic.id)).toEqual([clinicB]);
  });

  test("an org admin cannot touch a clinic from another organization", async () => {
    await assertOrgClinic(orgA, clinicA);
    await expect(assertOrgClinic(orgA, clinicB)).rejects.toThrow(
      "Clinic not found in this organization",
    );
  });

  test("the organization is derived from the session for an org admin", async () => {
    expect(await organizationFor(orgAdmin)).toBe(orgA);
    expect(await organizationFor(orgAdmin, orgB)).toBe(orgA);
  });

  test("a platform admin has to name the organization", async () => {
    await expect(organizationFor(platformAdmin)).rejects.toThrow(
      "Choose an organization.",
    );
    expect(await organizationFor(platformAdmin, orgB)).toBe(orgB);
  });

  test("the customer list reports both organizations", async () => {
    const ids = (await listOrganizations()).map((row) => row.id);
    expect(ids).toContain(orgA);
    expect(ids).toContain(orgB);
  });
});
