import {
  ConflictError,
  NotFoundError,
} from "@api/features/shared/errors/index";
import { user } from "@db/auth/schema/index";
import { db } from "@db/client";
import { clinics } from "@db/directory/schema/index";
import type { AdminClinicSummary } from "@hermes/types";
import type { ClinicCreate, ClinicUpdate } from "@hermes/validators";
import { and, asc, count, eq } from "drizzle-orm";
import { isUniqueViolation, serializeClinic } from "./organization-shared";

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
