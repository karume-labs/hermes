import { user } from "@db/auth/schema/index";
import { clinics, patients } from "@db/directory/schema/index";
import { lifecycleTimestamps } from "@db/utils";
import type {
  CaseStatus,
  CaseTaskKind,
  CaseTaskStatus,
  ConfirmationStatus,
  ConsultationOutcome,
  ReferralStatus,
} from "@hermes/types";
import { relations } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  jsonb,
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
export const caseReferrals = pgTable(
  "case_referrals",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    caseId: uuid("case_id")
      .notNull()
      .references(() => careCases.id, { onDelete: "cascade" }),
    fromClinicId: text("from_clinic_id")
      .notNull()
      .references(() => clinics.id, { onDelete: "restrict" }),
    toClinicId: text("to_clinic_id")
      .notNull()
      .references(() => clinics.id, { onDelete: "restrict" }),
    note: text("note").notNull(),
    status: text("status").notNull().default("sent").$type<ReferralStatus>(),
    sentBy: text("sent_by").notNull(),
    acceptedBy: text("accepted_by"),
    acceptedAt: timestamp("accepted_at", { withTimezone: true }),
    declinedBy: text("declined_by"),
    declinedAt: timestamp("declined_at", { withTimezone: true }),
    declineReason: text("decline_reason"),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    completedBy: text("completed_by"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("case_referrals_case_idx").on(table.caseId, table.createdAt),
    index("case_referrals_inbox_idx").on(table.toClinicId, table.status),
  ],
);

// Operational work created by escalation, SLA breach or a referral. Tasks are
// assigned to a person and are visible in the clinic queue, so an escalation
// cannot be satisfied by notifying the patient alone.
export const caseTasks = pgTable(
  "case_tasks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    caseId: uuid("case_id")
      .notNull()
      .references(() => careCases.id, { onDelete: "cascade" }),
    clinicId: text("clinic_id")
      .notNull()
      .references(() => clinics.id, { onDelete: "cascade" }),
    assignedToId: text("assigned_to_id").references(() => user.id, {
      onDelete: "set null",
    }),
    kind: text("kind").notNull().$type<CaseTaskKind>(),
    title: text("title").notNull(),
    detail: text("detail"),
    status: text("status").notNull().default("open").$type<CaseTaskStatus>(),
    dueAt: timestamp("due_at", { withTimezone: true }),
    createdBy: text("created_by").notNull().default("system"),
    doneBy: text("done_by"),
    doneAt: timestamp("done_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("case_tasks_clinic_status_idx").on(table.clinicId, table.status),
    index("case_tasks_case_idx").on(table.caseId, table.status),
    index("case_tasks_assignee_idx").on(table.assignedToId, table.status),
  ],
);

// Patient-reported understanding and reassurance after reading the result.
// This is the teach-back signal the brief asks for, not merely a read receipt.
export const caseFeedback = pgTable(
  "case_feedback",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    caseId: uuid("case_id")
      .notNull()
      .references(() => careCases.id, { onDelete: "cascade" }),
    patientId: text("patient_id")
      .notNull()
      .references(() => patients.id, { onDelete: "cascade" }),
    understood: boolean("understood").notNull(),
    confidence: integer("confidence").notNull(),
    comment: text("comment"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("case_feedback_case_idx").on(table.caseId),
    index("case_feedback_patient_idx").on(table.patientId),
  ],
);

// Clinician-to-clinician consultation thread. Kept separate from the patient
// message thread so internal clinical discussion never reaches the patient app.
export const caseConsultNotes = pgTable(
  "case_consult_notes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    caseId: uuid("case_id")
      .notNull()
      .references(() => careCases.id, { onDelete: "cascade" }),
    authorId: text("author_id").notNull(),
    authorName: text("author_name").notNull(),
    authorRole: text("author_role").notNull(),
    body: text("body").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("case_consult_notes_case_idx").on(table.caseId, table.createdAt),
  ],
);

export const auditTrail = pgTable("audit_trail", {
  id: uuid("id").primaryKey().defaultRandom(),
  caseId: uuid("case_id")
    .notNull()
    .references(() => careCases.id, { onDelete: "cascade" }),
  actor: text("actor").notNull(),
  action: text("action").notNull(),
  detail: jsonb("detail"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const careCasesRelations = relations(careCases, ({ many }) => ({
  auditEntries: many(auditTrail),
}));

export const auditTrailRelations = relations(auditTrail, ({ one }) => ({
  careCase: one(careCases, {
    fields: [auditTrail.caseId],
    references: [careCases.id],
  }),
}));
