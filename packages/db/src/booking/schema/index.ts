import { careCases } from "@db/care-loop/schema/index";
import type { BookingStatus, SlotKind } from "@hermes/types";
import { relations } from "drizzle-orm";
import { index, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

// Slot ids are clinic-scoped strings (`<clinic>-slot-1`) so the mobile client
// can reason about them offline before a booking is confirmed.
export const slots = pgTable(
  "slots",
  {
    id: text("id").primaryKey(),
    clinicId: text("clinic_id").notNull(),
    startAt: timestamp("start_at", { withTimezone: true }).notNull(),
    endAt: timestamp("end_at", { withTimezone: true }).notNull(),
    kind: text("kind").notNull().$type<SlotKind>(),
    heldByCaseId: uuid("held_by_case_id").references(() => careCases.id, {
      onDelete: "set null",
    }),
  },
  (table) => [
    index("slots_clinic_start_idx").on(table.clinicId, table.startAt),
  ],
);

export const bookings = pgTable(
  "bookings",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    caseId: uuid("case_id")
      .notNull()
      .references(() => careCases.id, { onDelete: "cascade" }),
    slotId: text("slot_id")
      .notNull()
      .references(() => slots.id, { onDelete: "restrict" }),
    status: text("status").notNull().$type<BookingStatus>(),
    prepInstructions: text("prep_instructions").notNull().default(""),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [index("bookings_case_idx").on(table.caseId)],
);

export const bookingsRelations = relations(bookings, ({ one }) => ({
  careCase: one(careCases, {
    fields: [bookings.caseId],
    references: [careCases.id],
  }),
  slot: one(slots, {
    fields: [bookings.slotId],
    references: [slots.id],
  }),
}));

export const slotsRelations = relations(slots, ({ one, many }) => ({
  heldByCase: one(careCases, {
    fields: [slots.heldByCaseId],
    references: [careCases.id],
  }),
  bookings: many(bookings),
}));
