import { ConflictError } from "@api/features/shared/errors/index";
import { user } from "@db/auth/schema/index";
import { auditTrail, careCases } from "@db/care-loop/schema/index";
import { db } from "@db/client";
import { clinics, patients } from "@db/directory/schema/index";
import type { AdminAuditEntry, AdminClinicSummary } from "@hermes/types";
import { asc, count, desc, eq, ne } from "drizzle-orm";

const countFor = (
  rows: Array<{ clinicId: string | null; total: number | string }>,
  clinicId: string,
): number => {
  const row = rows.find((item) => item.clinicId === clinicId);
  return row === undefined ? 0 : Number(row.total);
};

export const listAdminClinics = async (): Promise<AdminClinicSummary[]> => {
  const [clinicRows, patientRows, staffRows, caseRows] = await Promise.all([
    db.select().from(clinics).orderBy(asc(clinics.name)),
    db
      .select({ clinicId: patients.clinicId, total: count() })
      .from(patients)
      .groupBy(patients.clinicId),
    db
      .select({ clinicId: user.clinicId, total: count() })
      .from(user)
      .groupBy(user.clinicId),
    db
      .select({ clinicId: careCases.clinicId, total: count() })
      .from(careCases)
      .where(ne(careCases.status, "closed"))
      .groupBy(careCases.clinicId),
  ]);

  return clinicRows.map((clinic) => ({
    ...clinic,
    createdAt: clinic.createdAt.toISOString(),
    updatedAt: clinic.updatedAt.toISOString(),
    patientCount: countFor(patientRows, clinic.id),
    staffCount: countFor(staffRows, clinic.id),
    openCaseCount: countFor(caseRows, clinic.id),
  }));
};

const serializeClinic = (row: typeof clinics.$inferSelect) => ({
  ...row,
  createdAt: row.createdAt.toISOString(),
  updatedAt: row.updatedAt.toISOString(),
});

// Postgres unique violations arrive either bare or wrapped in Drizzle's query
// error, so both shapes are checked before falling through to a 500.
const isUniqueViolation = (error: unknown): boolean => {
  if (typeof error !== "object" || error === null) return false;
  if ("code" in error && error.code === "23505") return true;
  return "cause" in error && isUniqueViolation(error.cause);
};

export const createClinic = async (input: {
  id: string;
  name: string;
  timezone?: string;
  isActive?: boolean;
}) => {
  try {
    const [row] = await db
      .insert(clinics)
      .values({
        id: input.id,
        name: input.name,
        timezone: input.timezone ?? "Africa/Nairobi",
        isActive: input.isActive ?? true,
      })
      .returning();
    return row === undefined ? null : serializeClinic(row);
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw new ConflictError("A clinic with this id already exists");
    }
    throw error;
  }
};

export const updateClinic = async (
  id: string,
  patch: { name?: string; timezone?: string; isActive?: boolean },
) => {
  const [row] = await db
    .update(clinics)
    .set(patch)
    .where(eq(clinics.id, id))
    .returning();
  return row === undefined ? null : serializeClinic(row);
};

export const listAdminAudit = async (): Promise<AdminAuditEntry[]> => {
  const rows = await db
    .select({
      id: auditTrail.id,
      caseId: auditTrail.caseId,
      actor: auditTrail.actor,
      action: auditTrail.action,
      detail: auditTrail.detail,
      createdAt: auditTrail.createdAt,
      patientName: patients.name,
      clinicName: clinics.name,
      caseSummary: careCases.summaryPlainLanguage,
    })
    .from(auditTrail)
    .innerJoin(careCases, eq(auditTrail.caseId, careCases.id))
    .innerJoin(patients, eq(careCases.patientId, patients.id))
    .innerJoin(clinics, eq(careCases.clinicId, clinics.id))
    .orderBy(desc(auditTrail.createdAt))
    .limit(100);

  return rows.map((row) => ({
    id: row.id,
    caseId: row.caseId,
    actor: row.actor,
    action: row.action,
    detail: row.detail,
    createdAt: row.createdAt.toISOString(),
    patientName: row.patientName,
    clinicName: row.clinicName,
    caseSummary: row.caseSummary,
  }));
};
