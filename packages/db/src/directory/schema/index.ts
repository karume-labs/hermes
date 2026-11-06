import { boolean, index, pgTable, text, timestamp } from "drizzle-orm/pg-core";

// Clinics are the tenancy boundary: staff, patients, slots, routing rules and
// cases all resolve to one of these rows. Ids stay human-readable strings
// because slots and routing rules already embed them (`clinic-1-slot-1`).
export const clinics = pgTable("clinics", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  timezone: text("timezone").notNull().default("Africa/Nairobi"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

// One row per patient. `id` is the clinic's stable patient identifier (the id
// lab feeds already send); phone is the login identity for the mobile app.
export const patients = pgTable(
  "patients",
  {
    id: text("id").primaryKey(),
    clinicId: text("clinic_id")
      .notNull()
      .references(() => clinics.id, { onDelete: "restrict" }),
    name: text("name").notNull(),
    phone: text("phone").notNull().unique(),
    email: text("email"),
    dateOfBirth: text("date_of_birth"),
    pushConsent: boolean("push_consent").notNull().default(false),
    smsConsent: boolean("sms_consent").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("patients_clinic_idx").on(table.clinicId)],
);
