import { user } from "@db/auth/schema/index";
import { clinics, patients } from "@db/directory/schema/index";
import { lifecycleTimestamps } from "@db/utils";
import type {
  CaseStatus,
  ConfirmationStatus,
  ConsultationOutcome,
} from "@hermes/types";
import {
  index,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const careCases = pgTable(
  "care_cases",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    patientId: text("patient_id")
      .notNull()
      .references(() => patients.id, { onDelete: "restrict" }),
    clinicId: text("clinic_id")
      .notNull()
      .references(() => clinics.id, { onDelete: "restrict" }),
    labPayloadId: text("lab_payload_id").notNull(),
    severity: text("severity")
      .notNull()
      .$type<"Routine" | "Actionable" | "Urgent">(),
    status: text("status").notNull().$type<CaseStatus>(),
    slaDueAt: timestamp("sla_due_at", { withTimezone: true }).notNull(),
    summaryPlainLanguage: text("summary_plain_language").notNull(),
    acknowledgedAt: timestamp("acknowledged_at", { withTimezone: true }),
    appointmentId: uuid("appointment_id"),
    referralClinicId: text("referral_clinic_id"),
    // Named accountability. The assignee is a staff account, not a free-text
    // name, and can be changed as the case moves between teams.
    assignedToId: text("assigned_to_id").references(() => user.id, {
      onDelete: "set null",
    }),
    // Confirmatory testing is a clinical event with its own outcome, separate
    // from the screening result that opened the case.
    confirmationStatus: text("confirmation_status")
      .notNull()
      .default("pending")
      .$type<ConfirmationStatus>(),
    confirmedAt: timestamp("confirmed_at", { withTimezone: true }),
    confirmationNotes: text("confirmation_notes"),
    // What happened when a clinician reviewed the patient.
    consultedAt: timestamp("consulted_at", { withTimezone: true }),
    consultationOutcome: text(
      "consultation_outcome",
    ).$type<ConsultationOutcome>(),
    consultationNotes: text("consultation_notes"),
    // Treatment and surveillance are structured so closure has something to
    // audit and so follow-up can be measured.
    treatmentStartedAt: timestamp("treatment_started_at", {
      withTimezone: true,
    }),
    treatmentSummary: text("treatment_summary"),
    surveillancePlan: text("surveillance_plan"),
    nextReviewAt: timestamp("next_review_at", { withTimezone: true }),
    dropOffReason: text("drop_off_reason"),
    escalatedAt: timestamp("escalated_at", { withTimezone: true }),
    closedAt: timestamp("closed_at", { withTimezone: true }),
    closurePlan: text("closure_plan"),
    closureEvidence: text("closure_evidence"),
    closedBy: text("closed_by"),
    ...lifecycleTimestamps(),
  },
  (table) => [
    uniqueIndex("care_cases_lab_payload_idx").on(table.labPayloadId),
    index("care_cases_clinic_created_idx").on(table.clinicId, table.createdAt),
    index("care_cases_status_sla_idx").on(table.status, table.slaDueAt),
    index("care_cases_patient_idx").on(table.patientId),
    index("care_cases_assignee_idx").on(table.assignedToId),
  ],
);

// One row per referral attempt. The case keeps the active destination on
// `referralClinicId`; this table preserves the hand-off history and, critically,
// lets the receiving clinic accept, decline or complete the referral.
