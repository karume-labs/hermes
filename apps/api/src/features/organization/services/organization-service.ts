import type { StaffContext } from "@api/features/shared/auth/index";
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
} from "@api/features/shared/errors/index";
import { staffInvites, user } from "@db/auth/schema/index";
import { db } from "@db/client";
import { clinics, organizations } from "@db/directory/schema/index";
import type { AdminClinicSummary, OrganizationSummary } from "@hermes/types";
import type {
  ClinicCreate,
  ClinicUpdate,
  OrganizationCreate,
  OrganizationUpdate,
} from "@hermes/validators";
import { and, asc, count, desc, eq, isNull } from "drizzle-orm";

const serializeClinic = (row: typeof clinics.$inferSelect) => ({
  ...row,
  createdAt: row.createdAt.toISOString(),
  updatedAt: row.updatedAt.toISOString(),
});

const isUniqueViolation = (error: unknown): boolean => {
  if (typeof error !== "object" || error === null) return false;
  if ("code" in error && error.code === "23505") return true;
  return "cause" in error && isUniqueViolation(error.cause);
};

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

export const listOrganizationClinics = async (
  organizationId: string,
): Promise<AdminClinicSummary[]> => {
  const clinicRows = await db
    .select()
    .from(clinics)
    .where(eq(clinics.organizationId, organizationId))
    .orderBy(asc(clinics.name));
  const [patientRows, staffRows, openCaseRows] = await Promise.all([
    db
      .select({ clinicId: user.clinicId, total: count() })
      .from(user)
      .groupBy(user.clinicId),
    db
      .select({ clinicId: clinics.id, total: count() })
      .from(user)
      .where(eq(user.organizationId, organizationId))
      .groupBy(clinics.id),
    db
      .select({ clinicId: user.clinicId, total: count() })
      .from(user)
      .groupBy(user.clinicId),
  ]);
  void patientRows;
  void openCaseRows;
  const staffCountFor = (clinicId: string): number =>
    Number(staffRows.find((row) => row.clinicId === clinicId)?.total ?? 0);
  return clinicRows.map((clinic) => ({
    ...serializeClinic(clinic),
    patientCount: 0,
    staffCount: staffCountFor(clinic.id),
    openCaseCount: 0,
  }));
};

export const createOrganizationClinic = async (
  organizationId: string,
  input: ClinicCreate,
): Promise<AdminClinicSummary> => {
  try {
    const [row] = await db
      .insert(clinics)
      .values({
        id: input.id,
        organizationId,
        name: input.name,
        timezone: input.timezone ?? "Africa/Nairobi",
        isActive: input.isActive ?? true,
      })
      .returning();
    if (row === undefined) throw new ConflictError("Could not create it.");
    return {
      ...serializeClinic(row),
      patientCount: 0,
      staffCount: 0,
      openCaseCount: 0,
    };
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw new ConflictError("A clinic with this id already exists");
    }
    throw error;
  }
};

export const updateOrganizationClinic = async (
  organizationId: string,
  clinicId: string,
  patch: ClinicUpdate,
): Promise<AdminClinicSummary> => {
  const [row] = await db
    .update(clinics)
    .set(patch)
    .where(
      and(eq(clinics.id, clinicId), eq(clinics.organizationId, organizationId)),
    )
    .returning();
  if (row === undefined) throw new NotFoundError("Clinic not found");
  return {
    ...serializeClinic(row),
    patientCount: 0,
    staffCount: 0,
    openCaseCount: 0,
  };
};

/** Org admins may only touch a clinic that belongs to their organization. */
export const assertOrgClinic = async (
  organizationId: string,
  clinicId: string | null,
): Promise<void> => {
  if (clinicId === null) return;
  const [row] = await db
    .select({ id: clinics.id, isActive: clinics.isActive })
    .from(clinics)
    .where(
      and(eq(clinics.id, clinicId), eq(clinics.organizationId, organizationId)),
    )
    .limit(1);
  if (row === undefined || !row.isActive) {
    throw new NotFoundError("Clinic not found in this organization");
  }
};

export const listOrganizationInvites = (organizationId: string) =>
  db
    .select({
      id: staffInvites.id,
      email: staffInvites.email,
      name: staffInvites.name,
      role: staffInvites.role,
      clinicId: staffInvites.clinicId,
      expiresAt: staffInvites.expiresAt,
      createdAt: staffInvites.createdAt,
    })
    .from(staffInvites)
    .where(
      and(
        eq(staffInvites.organizationId, organizationId),
        isNull(staffInvites.acceptedAt),
      ),
    )
    .orderBy(desc(staffInvites.createdAt));
