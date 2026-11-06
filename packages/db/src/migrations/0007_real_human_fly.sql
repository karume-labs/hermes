CREATE TABLE "case_feedback" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"case_id" uuid NOT NULL,
	"patient_id" text NOT NULL,
	"understood" boolean NOT NULL,
	"confidence" integer NOT NULL,
	"comment" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "case_referrals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"case_id" uuid NOT NULL,
	"from_clinic_id" text NOT NULL,
	"to_clinic_id" text NOT NULL,
	"note" text NOT NULL,
	"status" text DEFAULT 'sent' NOT NULL,
	"sent_by" text NOT NULL,
	"accepted_by" text,
	"accepted_at" timestamp with time zone,
	"declined_by" text,
	"declined_at" timestamp with time zone,
	"decline_reason" text,
	"completed_at" timestamp with time zone,
	"completed_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "case_tasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"case_id" uuid NOT NULL,
	"clinic_id" text NOT NULL,
	"assigned_to_id" text,
	"kind" text NOT NULL,
	"title" text NOT NULL,
	"detail" text,
	"status" text DEFAULT 'open' NOT NULL,
	"due_at" timestamp with time zone,
	"created_by" text DEFAULT 'system' NOT NULL,
	"done_by" text,
	"done_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "care_cases" ADD COLUMN "assigned_to_id" text;--> statement-breakpoint
ALTER TABLE "care_cases" ADD COLUMN "confirmation_status" text DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE "care_cases" ADD COLUMN "confirmed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "care_cases" ADD COLUMN "confirmation_notes" text;--> statement-breakpoint
ALTER TABLE "care_cases" ADD COLUMN "consulted_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "care_cases" ADD COLUMN "consultation_outcome" text;--> statement-breakpoint
ALTER TABLE "care_cases" ADD COLUMN "consultation_notes" text;--> statement-breakpoint
ALTER TABLE "care_cases" ADD COLUMN "treatment_started_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "care_cases" ADD COLUMN "treatment_summary" text;--> statement-breakpoint
ALTER TABLE "care_cases" ADD COLUMN "surveillance_plan" text;--> statement-breakpoint
ALTER TABLE "care_cases" ADD COLUMN "next_review_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "care_cases" ADD COLUMN "drop_off_reason" text;--> statement-breakpoint
ALTER TABLE "patients" ADD COLUMN "language" text DEFAULT 'en' NOT NULL;--> statement-breakpoint
ALTER TABLE "case_feedback" ADD CONSTRAINT "case_feedback_case_id_care_cases_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."care_cases"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "case_feedback" ADD CONSTRAINT "case_feedback_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "case_referrals" ADD CONSTRAINT "case_referrals_case_id_care_cases_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."care_cases"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "case_referrals" ADD CONSTRAINT "case_referrals_from_clinic_id_clinics_id_fk" FOREIGN KEY ("from_clinic_id") REFERENCES "public"."clinics"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "case_referrals" ADD CONSTRAINT "case_referrals_to_clinic_id_clinics_id_fk" FOREIGN KEY ("to_clinic_id") REFERENCES "public"."clinics"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "case_tasks" ADD CONSTRAINT "case_tasks_case_id_care_cases_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."care_cases"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "case_tasks" ADD CONSTRAINT "case_tasks_clinic_id_clinics_id_fk" FOREIGN KEY ("clinic_id") REFERENCES "public"."clinics"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "case_tasks" ADD CONSTRAINT "case_tasks_assigned_to_id_user_id_fk" FOREIGN KEY ("assigned_to_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "case_feedback_case_idx" ON "case_feedback" USING btree ("case_id");--> statement-breakpoint
CREATE INDEX "case_feedback_patient_idx" ON "case_feedback" USING btree ("patient_id");--> statement-breakpoint
CREATE INDEX "case_referrals_case_idx" ON "case_referrals" USING btree ("case_id","created_at");--> statement-breakpoint
CREATE INDEX "case_referrals_inbox_idx" ON "case_referrals" USING btree ("to_clinic_id","status");--> statement-breakpoint
CREATE INDEX "case_tasks_clinic_status_idx" ON "case_tasks" USING btree ("clinic_id","status");--> statement-breakpoint
CREATE INDEX "case_tasks_case_idx" ON "case_tasks" USING btree ("case_id","status");--> statement-breakpoint
CREATE INDEX "case_tasks_assignee_idx" ON "case_tasks" USING btree ("assigned_to_id","status");--> statement-breakpoint
ALTER TABLE "care_cases" ADD CONSTRAINT "care_cases_assigned_to_id_user_id_fk" FOREIGN KEY ("assigned_to_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "care_cases_assignee_idx" ON "care_cases" USING btree ("assigned_to_id");