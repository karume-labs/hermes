import type { EmailStatus } from "@hermes/types";
import {
  index,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

// Every attempt to send transactional mail, including sends skipped because
// the recipient prefers in-app only. The admin delivery view reads this table,
// so a missing email is explainable rather than mysterious.
export const emailLogs = pgTable(
  "email_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    recipient: varchar("recipient", { length: 320 }).notNull(),
    subject: varchar("subject", { length: 200 }).notNull(),
    kind: varchar("kind", { length: 60 }).notNull(),
    status: varchar("status", { length: 16 }).notNull().$type<EmailStatus>(),
    error: text("error"),
    skipReason: text("skip_reason"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("email_logs_recipient_idx").on(table.recipient, table.createdAt),
    index("email_logs_status_idx").on(table.status, table.createdAt),
  ],
);
