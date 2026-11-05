import type {
  NotificationChannel,
  NotificationKind,
  NotificationStatus,
} from "@hermes/types";
import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

// Outbox: every notification is written before delivery so the dispatcher can
// retry it and the admin UI can show delivery state per case.
export const notifications = pgTable(
  "notifications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    caseId: uuid("case_id").notNull(),
    patientId: text("patient_id").notNull(),
    channel: text("channel").notNull().$type<NotificationChannel>(),
    kind: text("kind")
      .notNull()
      .default("case_alert")
      .$type<NotificationKind>(),
    status: text("status").notNull().$type<NotificationStatus>(),
    payload: jsonb("payload"),
    attempts: integer("attempts").notNull().default(0),
    error: text("error"),
    sentAt: timestamp("sent_at", { withTimezone: true }),
    readAt: timestamp("read_at", { withTimezone: true }),
    // Retry backoff: a failed send is retried once this instant passes.
    nextAttemptAt: timestamp("next_attempt_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("notifications_case_idx").on(table.caseId, table.createdAt),
    index("notifications_status_idx").on(table.status, table.nextAttemptAt),
  ],
);

export const webhookLogs = pgTable(
  "webhook_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    source: text("source").notNull(),
    ok: boolean("ok").notNull(),
    status: text("status").notNull(),
    detail: jsonb("detail"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [index("webhook_logs_created_idx").on(table.createdAt)],
);
