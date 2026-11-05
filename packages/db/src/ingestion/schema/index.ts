import { lifecycleTimestamps } from "@db/utils";
import { boolean, pgTable, text, uuid } from "drizzle-orm/pg-core";

// Routing is data, not code: a lab marker prefix maps to the clinic that owns
// follow-up. Longest matching prefix wins so `ldl` can override `lipid`.
export const routingRules = pgTable("routing_rules", {
  id: uuid("id").primaryKey().defaultRandom(),
  markerPrefix: text("marker_prefix").notNull().unique(),
  clinicId: text("clinic_id").notNull(),
  active: boolean("active").notNull().default(true),
  ...lifecycleTimestamps(),
});
