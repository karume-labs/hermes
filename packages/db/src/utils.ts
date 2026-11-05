import { timestamp } from "drizzle-orm/pg-core";

// Shared lifecycle columns; spread into tables that need them.
export const lifecycleTimestamps = () => ({
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});
