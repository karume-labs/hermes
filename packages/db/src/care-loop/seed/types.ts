export type Severity = "Routine" | "Actionable" | "Urgent";

export type CaseStatus =
  | "received"
  | "triaged"
  | "notified"
  | "acknowledged"
  | "appointment_booked"
  | "referred"
  | "escalated"
  | "closed";

export interface SeedPatient {
  id: string;
  clinicId: string;
}

export interface GeneratedCase {
  slug: string;
  patientId: string;
  clinicId: string;
  severity: Severity;
  status: CaseStatus;
  createdHoursAgo: number;
  acknowledgedHoursAgo: number | null;
  escalatedHoursAgo?: number;
  closedHoursAgo?: number;
  referralClinicId?: string;
  closurePlan?: string;
  closureEvidence?: string;
  closedBy?: string;
  summary: string;
}

export interface GeneratedAudit {
  slug: string;
  hoursAfterCase: number;
  actor: string;
  action: string;
  detail?: Record<string, unknown>;
}

export interface GenerationResult {
  cases: GeneratedCase[];
  audit: GeneratedAudit[];
}
