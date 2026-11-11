import type { NotificationPreference } from "@hermes/types";
import {
  boolean,
  index,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

// An organization is the customer: a hospital group, insurer or medical
// network that runs one or more clinics. Everything below it (clinics, staff,
// patients) is tenant data owned by that organization.
export const organizations = pgTable("organizations", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  // The organization's own staff invite link is gated on this flag, so a
  // paused organization cannot onboard anyone new.
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

// Clinics are the tenancy boundary: staff, patients, slots, routing rules and
// cases all resolve to one of these rows. Ids stay human-readable strings
// because slots and routing rules already embed them (`clinic-1-slot-1`).
export const clinics = pgTable(
  "clinics",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id").references(() => organizations.id, {
      onDelete: "set null",
    }),
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
  },
  (table) => [index("clinics_organization_idx").on(table.organizationId)],
);

// One row per patient. `clinicId` is set when a clinic admits them; a patient
// who signed up themselves has no clinic yet and is linked by their phone
// number the first time a clinic sends them data.
export const patients = pgTable(
  "patients",
  {
    id: text("id").primaryKey(),
    clinicId: text("clinic_id").references(() => clinics.id, {
      onDelete: "restrict",
    }),
    name: text("name").notNull(),
    phone: text("phone").notNull().unique(),
    email: text("email"),
    dateOfBirth: text("date_of_birth"),
    pushConsent: boolean("push_consent").notNull().default(false),
    smsConsent: boolean("sms_consent").notNull().default(false),
    emailConsent: boolean("email_consent").notNull().default(false),
    // Where result alerts and reminders should reach the patient. `email`
    // still queues the in-app notice, so the app is never the only copy.
    notificationChannel: text("notification_channel")
      .notNull()
      .default("in_app")
      .$type<NotificationPreference>(),
    // Set when the patient created their own account, so the clinic roster can
    // show who is waiting to be linked.
    selfRegisteredAt: timestamp("self_registered_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("patients_clinic_idx").on(table.clinicId),
    uniqueIndex("patients_email_org_idx").on(table.email, table.clinicId),
  ],
);
