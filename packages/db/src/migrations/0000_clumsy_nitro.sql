CREATE TABLE "bookings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"case_id" uuid NOT NULL,
	"slot_id" text NOT NULL,
	"status" text NOT NULL,
	"prep_instructions" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "slots" (
	"id" text PRIMARY KEY NOT NULL,
	"clinic_id" text NOT NULL,
	"start_at" timestamp with time zone NOT NULL,
	"end_at" timestamp with time zone NOT NULL,
	"kind" text NOT NULL,
	"held_by_case_id" uuid
);
--> statement-breakpoint
CREATE TABLE "audit_trail" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"case_id" uuid NOT NULL,
	"actor" text NOT NULL,
	"action" text NOT NULL,
	"detail" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "care_cases" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"patient_id" text NOT NULL,
	"clinic_id" text NOT NULL,
	"lab_payload_id" text NOT NULL,
	"severity" text NOT NULL,
	"status" text NOT NULL,
	"sla_due_at" timestamp with time zone NOT NULL,
	"summary_plain_language" text NOT NULL,
	"acknowledged_at" timestamp with time zone,
	"appointment_id" uuid,
	"referral_clinic_id" text,
	"closed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"case_id" uuid NOT NULL,
	"channel" text NOT NULL,
	"status" text NOT NULL,
	"payload" jsonb,
	"attempts" integer DEFAULT 0 NOT NULL,
	"error" text,
	"sent_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "webhook_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source" text NOT NULL,
	"ok" boolean NOT NULL,
	"status" text NOT NULL,
	"detail" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_case_id_care_cases_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."care_cases"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_slot_id_slots_id_fk" FOREIGN KEY ("slot_id") REFERENCES "public"."slots"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "slots" ADD CONSTRAINT "slots_held_by_case_id_care_cases_id_fk" FOREIGN KEY ("held_by_case_id") REFERENCES "public"."care_cases"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_trail" ADD CONSTRAINT "audit_trail_case_id_care_cases_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."care_cases"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "bookings_case_idx" ON "bookings" USING btree ("case_id");--> statement-breakpoint
CREATE INDEX "slots_clinic_start_idx" ON "slots" USING btree ("clinic_id","start_at");--> statement-breakpoint
CREATE INDEX "notifications_case_idx" ON "notifications" USING btree ("case_id","created_at");--> statement-breakpoint
CREATE INDEX "webhook_logs_created_idx" ON "webhook_logs" USING btree ("created_at");