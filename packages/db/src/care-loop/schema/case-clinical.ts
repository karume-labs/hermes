import { careCases } from "@db/care-loop/schema/care-cases";
import { patients } from "@db/directory/schema/index";
import {
  boolean,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

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
