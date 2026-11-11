import { careCases } from "@db/care-loop/schema/care-cases";
import { clinics } from "@db/directory/schema/index";
import type { ReferralStatus } from "@hermes/types";
import { index, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

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
    // A hand-over between two clinicians in the same clinic has no clinic
    // change, so the people are recorded separately from the sites.
    fromUserId: text("from_user_id"),
    toUserId: text("to_user_id"),
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
    index("case_referrals_to_user_idx").on(table.toUserId, table.status),
  ],
);

// Operational work created by escalation, SLA breach or a referral. Tasks are
// assigned to a person and are visible in the clinic queue, so an escalation
// cannot be satisfied by notifying the patient alone.
