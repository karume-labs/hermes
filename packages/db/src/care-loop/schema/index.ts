import { lifecycleTimestamps } from "@db/utils";
import type { CaseStatus } from "@hermes/types";
import { relations } from "drizzle-orm";
import { jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const careCases = pgTable("care_cases", {
  id: uuid("id").primaryKey().defaultRandom(),
  patientId: text("patient_id").notNull(),
  clinicId: text("clinic_id").notNull(),
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
  escalatedAt: timestamp("escalated_at", { withTimezone: true }),
  closedAt: timestamp("closed_at", { withTimezone: true }),
  closurePlan: text("closure_plan"),
  closureEvidence: text("closure_evidence"),
  closedBy: text("closed_by"),
  ...lifecycleTimestamps(),
});

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
