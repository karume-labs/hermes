import { careCases } from "@db/care-loop/schema/index";
import type { AttachmentKind } from "@hermes/types";
import { relations } from "drizzle-orm";
import {
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

// Files live on the API server's disk; the row carries the metadata and the
// generated stored name so a download never trusts a client-supplied path.
export const caseAttachments = pgTable(
  "case_attachments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    caseId: uuid("case_id")
      .notNull()
      .references(() => careCases.id, { onDelete: "cascade" }),
    kind: text("kind").notNull().default("other").$type<AttachmentKind>(),
    filename: text("filename").notNull(),
    storedName: text("stored_name").notNull().unique(),
    mimeType: text("mime_type").notNull(),
    sizeBytes: integer("size_bytes").notNull(),
    uploadedBy: text("uploaded_by").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("case_attachments_case_idx").on(table.caseId, table.createdAt),
  ],
);

export const caseAttachmentsRelations = relations(
  caseAttachments,
  ({ one }) => ({
    careCase: one(careCases, {
      fields: [caseAttachments.caseId],
      references: [careCases.id],
    }),
  }),
);
