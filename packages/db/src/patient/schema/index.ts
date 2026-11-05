import { careCases } from "@db/care-loop/schema/index";
import type { MessageSender, MobileEventType } from "@hermes/types";
import { relations } from "drizzle-orm";
import {
  index,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

// One row per installed device. Tokens rotate, so the unique key is the token
// and `lastSeenAt` tells the dispatcher which devices are still reachable.
export const deviceTokens = pgTable(
  "device_tokens",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    patientId: text("patient_id").notNull(),
    token: text("token").notNull(),
    platform: text("platform").notNull(),
    lastSeenAt: timestamp("last_seen_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("device_tokens_token_idx").on(table.token),
    index("device_tokens_patient_idx").on(table.patientId),
  ],
);

// Secure thread shared by patient and coordinator for one case. Closing a case
// never deletes its thread; it is part of the audit trail.
export const caseMessages = pgTable(
  "case_messages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    caseId: uuid("case_id")
      .notNull()
      .references(() => careCases.id, { onDelete: "cascade" }),
    sender: text("sender").notNull().$type<MessageSender>(),
    senderId: text("sender_id").notNull(),
    body: text("body").notNull(),
    readAt: timestamp("read_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("case_messages_case_idx").on(table.caseId, table.createdAt),
  ],
);

// Engagement telemetry for retention and push-open rates. Deliberately stores
// no content — only the event name and the case it referred to.
export const mobileEvents = pgTable(
  "mobile_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    patientId: text("patient_id").notNull(),
    caseId: uuid("case_id").references(() => careCases.id, {
      onDelete: "set null",
    }),
    type: text("type").notNull().$type<MobileEventType>(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("mobile_events_patient_idx").on(table.patientId, table.createdAt),
  ],
);

export const caseMessagesRelations = relations(caseMessages, ({ one }) => ({
  careCase: one(careCases, {
    fields: [caseMessages.caseId],
    references: [careCases.id],
  }),
}));

export const mobileEventsRelations = relations(mobileEvents, ({ one }) => ({
  careCase: one(careCases, {
    fields: [mobileEvents.caseId],
    references: [careCases.id],
  }),
}));
