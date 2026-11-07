import { user } from "@db/auth/schema/index";
import { careCases } from "@db/care-loop/schema/care-cases";
import { clinics } from "@db/directory/schema/index";
import type { CaseTaskKind, CaseTaskStatus } from "@hermes/types";
import { index, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

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
