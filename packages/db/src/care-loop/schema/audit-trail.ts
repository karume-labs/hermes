import { careCases } from "@db/care-loop/schema/care-cases";
import { relations } from "drizzle-orm";
import { jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

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
