import type { StaffContext } from "@api/features/shared/auth/index";
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
} from "@api/features/shared/errors/index";
import { user } from "@db/auth/schema/index";
import { db } from "@db/client";
import { clinics, organizations } from "@db/directory/schema/index";
import type { OrganizationSummary } from "@hermes/types";
import type {
  OrganizationCreate,
  OrganizationUpdate,
} from "@hermes/validators";
import { asc, count, eq } from "drizzle-orm";
import { isUniqueViolation } from "./organization-shared";

export const requireOrganization = async (
  id: string,
): Promise<OrganizationSummary> => {
  const [row] = await db
    .select()
    .from(organizations)
    .where(eq(organizations.id, id))
    .limit(1);
  if (row === undefined) throw new NotFoundError("Organization not found");
  const [clinicRows, staffRows] = await Promise.all([
    db
      .select({ total: count() })
      .from(clinics)
      .where(eq(clinics.organizationId, id)),
    db.select({ total: count() }).from(user).where(eq(user.organizationId, id)),
  ]);
  return {
    ...row,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    clinicCount: Number(clinicRows[0]?.total ?? 0),
    staffCount: Number(staffRows[0]?.total ?? 0),
  };
};

/** Organization the caller governs; platform admins must name one. */
export const organizationFor = async (
  staff: StaffContext,
  requestedId?: string,
): Promise<string> => {
  if (staff.role === "org_admin") {
    if (staff.organizationId === null) {
      throw new ForbiddenError("This account has no organization.");
    }
    return staff.organizationId;
  }
  if (requestedId === undefined) {
    throw new ConflictError("Choose an organization.");
  }
  await requireOrganization(requestedId);
  return requestedId;
};

export const listOrganizations = async (): Promise<OrganizationSummary[]> => {
  const rows = await db
    .select()
    .from(organizations)
    .orderBy(asc(organizations.name));
  const [clinicRows, staffRows] = await Promise.all([
    db
      .select({ organizationId: clinics.organizationId, total: count() })
      .from(clinics)
      .groupBy(clinics.organizationId),
    db
      .select({ organizationId: user.organizationId, total: count() })
      .from(user)
      .groupBy(user.organizationId),
  ]);
  const countFor = (
    list: Array<{ organizationId: string | null; total: number | string }>,
    id: string,
  ): number =>
    Number(list.find((item) => item.organizationId === id)?.total ?? 0);
  return rows.map((row) => ({
    ...row,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    clinicCount: countFor(clinicRows, row.id),
    staffCount: countFor(staffRows, row.id),
  }));
};

export const createOrganization = async (
  input: OrganizationCreate,
): Promise<OrganizationSummary> => {
  try {
    const [row] = await db
      .insert(organizations)
      .values({
        id: input.id,
        name: input.name,
        isActive: input.isActive ?? true,
      })
      .returning();
    if (row === undefined) throw new ConflictError("Could not create it.");
    return requireOrganization(row.id);
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw new ConflictError("An organization with this id already exists");
    }
    throw error;
  }
};

export const updateOrganization = async (
  id: string,
  patch: OrganizationUpdate,
): Promise<OrganizationSummary> => {
  const [row] = await db
    .update(organizations)
    .set({
      ...(patch.name === undefined ? {} : { name: patch.name }),
      ...(patch.isActive === undefined ? {} : { isActive: patch.isActive }),
    })
    .where(eq(organizations.id, id))
    .returning({ id: organizations.id });
  if (row === undefined) throw new NotFoundError("Organization not found");
  return requireOrganization(id);
};
