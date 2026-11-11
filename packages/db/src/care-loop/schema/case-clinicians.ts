import { user } from "@db/auth/schema/index";
import { careCases } from "@db/care-loop/schema/care-cases";
import { clinics } from "@db/directory/schema/index";
import type { CaseAccess } from "@hermes/types";
import {
  index,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

// Everyone who may open a case, and in what role. The named owner is mirrored
// on `care_cases.assignedToId`; this table adds the rest of the care team and
// keeps a hand-over's previous clinician on the case with read access.
export const caseClinicians = pgTable(
  "case_clinicians",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    caseId: uuid("case_id")
      .notNull()
      .references(() => careCases.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    clinicId: text("clinic_id")
      .notNull()
      .references(() => clinics.id, { onDelete: "restrict" }),
    access: text("access")
      .notNull()
      .default("collaborator")
      .$type<CaseAccess>(),
    grantedBy: text("granted_by"),
    grantedAt: timestamp("granted_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
  },
  (table) => [
    uniqueIndex("case_clinicians_case_user_idx").on(table.caseId, table.userId),
    index("case_clinicians_user_idx").on(table.userId, table.revokedAt),
  ],
);
