import { auditTrail, careCases } from "@db/care-loop/schema/index";
import { db } from "@db/client";
import type { CareCase, CaseStatus, Severity } from "@hermes/types";
import { and, desc, eq } from "drizzle-orm";

export interface AuditEntry {
  id: string;
  caseId: string;
  actor: string;
  action: string;
  detail: unknown;
  createdAt: string;
}

type CaseRow = typeof careCases.$inferSelect;
type NewCase = typeof careCases.$inferInsert;

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// Ids reach us from URLs and Eden calls; reject non-UUIDs before Postgres
// casts them (an invalid cast would surface as a 500 instead of a 404).
export const isCaseId = (id: string): boolean => uuidPattern.test(id);

export const toCareCase = (row: CaseRow): CareCase => ({
  id: row.id,
  patientId: row.patientId,
  clinicId: row.clinicId,
  labPayloadId: row.labPayloadId,
  severity: row.severity,
  status: row.status,
  slaDueAt: row.slaDueAt.toISOString(),
  summaryPlainLanguage: row.summaryPlainLanguage,
  createdAt: row.createdAt.toISOString(),
  updatedAt: row.updatedAt.toISOString(),
  acknowledgedAt: row.acknowledgedAt?.toISOString() ?? null,
  appointmentId: row.appointmentId ?? null,
  referralClinicId: row.referralClinicId ?? null,
  escalatedAt: row.escalatedAt?.toISOString() ?? null,
  closurePlan: row.closurePlan ?? null,
  closureEvidence: row.closureEvidence ?? null,
  closedBy: row.closedBy ?? null,
  closedAt: row.closedAt?.toISOString() ?? null,
});

export interface CaseFilters {
  severity?: string;
  status?: string;
}

const isSeverity = (value: string): value is Severity =>
  value === "Routine" || value === "Actionable" || value === "Urgent";

const isStatus = (value: string): value is CaseStatus =>
  value === "received" ||
  value === "triaged" ||
  value === "notified" ||
  value === "acknowledged" ||
  value === "appointment_booked" ||
  value === "referred" ||
  value === "closed" ||
  value === "escalated";

// `clinicId` is the staff member's tenant: null means the caller is an admin
// or a system job and may read every clinic.
export const listCases = async (
  filters: CaseFilters,
  clinicId: string | null = null,
): Promise<CareCase[]> => {
  const predicates = [];
  if (clinicId !== null) predicates.push(eq(careCases.clinicId, clinicId));
  if (filters.severity !== undefined && isSeverity(filters.severity))
    predicates.push(eq(careCases.severity, filters.severity));
  if (filters.status !== undefined && isStatus(filters.status))
    predicates.push(eq(careCases.status, filters.status));
  const rows = await db
    .select()
    .from(careCases)
    .where(predicates.length > 0 ? and(...predicates) : undefined)
    .orderBy(desc(careCases.createdAt));
  return rows.map(toCareCase);
};

export const findCase = async (
  id: string,
  clinicId: string | null = null,
): Promise<CareCase | null> => {
  if (!isCaseId(id)) return null;
  const [row] = await db
    .select()
    .from(careCases)
    .where(
      clinicId === null
        ? eq(careCases.id, id)
        : and(eq(careCases.id, id), eq(careCases.clinicId, clinicId)),
    );
  if (row === undefined) return null;
  return toCareCase(row);
};

// Lab feeds retry. The source message id is the idempotency key, so a
// redelivered FHIR/HL7 payload resolves to the original case.
export const findCaseByLabPayloadId = async (
  labPayloadId: string,
): Promise<CareCase | null> => {
  const [row] = await db
    .select()
    .from(careCases)
    .where(eq(careCases.labPayloadId, labPayloadId))
    .limit(1);
  if (row === undefined) return null;
  return toCareCase(row);
};

export const listAllCases = async (
  clinicId: string | null = null,
): Promise<CareCase[]> => {
  const rows = await db
    .select()
    .from(careCases)
    .where(clinicId === null ? undefined : eq(careCases.clinicId, clinicId));
  return rows.map(toCareCase);
};

export const createCase = async (input: NewCase): Promise<CareCase> => {
  const [row] = await db.insert(careCases).values(input).returning();
  return toCareCase(row);
};

export const updateCase = async (
  id: string,
  patch: Partial<NewCase>,
): Promise<CareCase | null> => {
  if (!isCaseId(id)) return null;
  const [row] = await db
    .update(careCases)
    .set(patch)
    .where(eq(careCases.id, id))
    .returning();
  if (row === undefined) return null;
  return toCareCase(row);
};

export const listAudit = async (caseId: string): Promise<AuditEntry[]> => {
  if (!isCaseId(caseId)) return [];
  const rows = await db
    .select()
    .from(auditTrail)
    .where(eq(auditTrail.caseId, caseId))
    .orderBy(auditTrail.createdAt);
  return rows.map((row) => ({
    id: row.id,
    caseId: row.caseId,
    actor: row.actor,
    action: row.action,
    detail: row.detail,
    createdAt: row.createdAt.toISOString(),
  }));
};

export const logAudit = async (
  caseId: string,
  actor: string,
  action: string,
  detail: unknown = {},
): Promise<void> => {
  await db.insert(auditTrail).values({ caseId, actor, action, detail });
};
