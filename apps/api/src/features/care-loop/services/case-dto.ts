import type { careCases } from "@db/care-loop/schema/index";
import type { CareCase, CaseStatus, Severity } from "@hermes/types";

export interface AuditEntry {
  id: string;
  caseId: string;
  actor: string;
  action: string;
  detail: unknown;
  createdAt: string;
}

export type CaseRow = typeof careCases.$inferSelect;
export type NewCase = typeof careCases.$inferInsert;

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
  appointmentId: row.appointmentId,
  referralClinicId: row.referralClinicId,
  assignedToId: row.assignedToId,
  confirmationStatus: row.confirmationStatus,
  confirmedAt: row.confirmedAt?.toISOString() ?? null,
  confirmationNotes: row.confirmationNotes,
  consultedAt: row.consultedAt?.toISOString() ?? null,
  consultationOutcome: row.consultationOutcome,
  consultationNotes: row.consultationNotes,
  treatmentStartedAt: row.treatmentStartedAt?.toISOString() ?? null,
  treatmentSummary: row.treatmentSummary,
  surveillancePlan: row.surveillancePlan,
  nextReviewAt: row.nextReviewAt?.toISOString() ?? null,
  dropOffReason: row.dropOffReason,
  escalatedAt: row.escalatedAt?.toISOString() ?? null,
  closurePlan: row.closurePlan,
  closureEvidence: row.closureEvidence,
  closedBy: row.closedBy,
  closedAt: row.closedAt?.toISOString() ?? null,
});

export interface CaseFilters {
  severity?: string;
  status?: string;
  assignedToId?: string;
  unassigned?: boolean;
  overdue?: boolean;
}

export const isSeverity = (value: string): value is Severity =>
  value === "Routine" || value === "Actionable" || value === "Urgent";

export const isStatus = (value: string): value is CaseStatus =>
  value === "received" ||
  value === "triaged" ||
  value === "notified" ||
  value === "acknowledged" ||
  value === "appointment_booked" ||
  value === "referred" ||
  value === "closed" ||
  value === "escalated";

// The receiving clinic must see the shared case, not only the referring one.
// An active referral (sent or accepted) widens the tenant boundary.
