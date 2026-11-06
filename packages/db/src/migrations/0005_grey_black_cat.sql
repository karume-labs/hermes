CREATE TABLE "staff_invites" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"role" text DEFAULT 'coordinator' NOT NULL,
	"clinic_id" text,
	"token_hash" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"accepted_at" timestamp with time zone,
	"created_by" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "staff_invites_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
CREATE TABLE "clinics" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"timezone" text DEFAULT 'Africa/Nairobi' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "patients" (
	"id" text PRIMARY KEY NOT NULL,
	"clinic_id" text NOT NULL,
	"name" text NOT NULL,
	"phone" text NOT NULL,
	"email" text,
	"date_of_birth" text,
	"push_consent" boolean DEFAULT false NOT NULL,
	"sms_consent" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "patients_phone_unique" UNIQUE("phone")
);
--> statement-breakpoint
CREATE TABLE "patient_login_codes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"patient_id" text NOT NULL,
	"code_hash" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"consumed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "patient_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"patient_id" text NOT NULL,
	"token_hash" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"revoked_at" timestamp with time zone,
	"last_used_at" timestamp with time zone,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "patient_sessions_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "clinic_id" text;--> statement-breakpoint
-- Backfill the tenancy tables from the ids the pre-005 schema used as free
-- text, so the new foreign keys apply to an already-seeded database too.
INSERT INTO "clinics" ("id", "name")
SELECT DISTINCT "clinic_id", initcap(replace("clinic_id", '-', ' ')) FROM "care_cases"
ON CONFLICT ("id") DO NOTHING;--> statement-breakpoint
INSERT INTO "clinics" ("id", "name")
SELECT DISTINCT "clinic_id", initcap(replace("clinic_id", '-', ' ')) FROM "slots"
ON CONFLICT ("id") DO NOTHING;--> statement-breakpoint
INSERT INTO "patients" ("id", "clinic_id", "name", "phone")
SELECT p."patient_id", p."clinic_id", initcap(replace(p."patient_id", '-', ' ')),
  '+2547' || lpad(p."row_number"::text, 8, '0')
FROM (
  SELECT "patient_id", min("clinic_id") AS "clinic_id",
    row_number() OVER (ORDER BY "patient_id") AS "row_number"
  FROM "care_cases"
  GROUP BY "patient_id"
) p
ON CONFLICT ("id") DO NOTHING;--> statement-breakpoint
ALTER TABLE "staff_invites" ADD CONSTRAINT "staff_invites_clinic_id_clinics_id_fk" FOREIGN KEY ("clinic_id") REFERENCES "public"."clinics"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patients" ADD CONSTRAINT "patients_clinic_id_clinics_id_fk" FOREIGN KEY ("clinic_id") REFERENCES "public"."clinics"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patient_login_codes" ADD CONSTRAINT "patient_login_codes_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patient_sessions" ADD CONSTRAINT "patient_sessions_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "staff_invites_email_idx" ON "staff_invites" USING btree ("email");--> statement-breakpoint
CREATE INDEX "patients_clinic_idx" ON "patients" USING btree ("clinic_id");--> statement-breakpoint
CREATE INDEX "patient_login_codes_patient_idx" ON "patient_login_codes" USING btree ("patient_id","created_at");--> statement-breakpoint
CREATE INDEX "patient_sessions_patient_idx" ON "patient_sessions" USING btree ("patient_id","expires_at");--> statement-breakpoint
ALTER TABLE "user" ADD CONSTRAINT "user_clinic_id_clinics_id_fk" FOREIGN KEY ("clinic_id") REFERENCES "public"."clinics"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "care_cases" ADD CONSTRAINT "care_cases_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "care_cases" ADD CONSTRAINT "care_cases_clinic_id_clinics_id_fk" FOREIGN KEY ("clinic_id") REFERENCES "public"."clinics"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "bookings_slot_idx" ON "bookings" USING btree ("slot_id");--> statement-breakpoint
CREATE UNIQUE INDEX "bookings_case_confirmed_idx" ON "bookings" USING btree ("case_id") WHERE "bookings"."status" = 'confirmed';--> statement-breakpoint
CREATE UNIQUE INDEX "bookings_slot_active_idx" ON "bookings" USING btree ("slot_id") WHERE "bookings"."status" in ('held', 'confirmed');--> statement-breakpoint
CREATE INDEX "slots_held_by_case_idx" ON "slots" USING btree ("held_by_case_id");--> statement-breakpoint
CREATE UNIQUE INDEX "care_cases_lab_payload_idx" ON "care_cases" USING btree ("lab_payload_id");--> statement-breakpoint
CREATE INDEX "care_cases_clinic_created_idx" ON "care_cases" USING btree ("clinic_id","created_at");--> statement-breakpoint
CREATE INDEX "care_cases_status_sla_idx" ON "care_cases" USING btree ("status","sla_due_at");--> statement-breakpoint
CREATE INDEX "care_cases_patient_idx" ON "care_cases" USING btree ("patient_id");--> statement-breakpoint
CREATE INDEX "notifications_patient_idx" ON "notifications" USING btree ("patient_id","created_at");