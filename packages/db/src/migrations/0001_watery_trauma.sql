CREATE TABLE "routing_rules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"marker_prefix" text NOT NULL,
	"clinic_id" text NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "routing_rules_marker_prefix_unique" UNIQUE("marker_prefix")
);
--> statement-breakpoint
CREATE TABLE "case_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"case_id" uuid NOT NULL,
	"sender" text NOT NULL,
	"sender_id" text NOT NULL,
	"body" text NOT NULL,
	"read_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "device_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"patient_id" text NOT NULL,
	"token" text NOT NULL,
	"platform" text NOT NULL,
	"last_seen_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mobile_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"patient_id" text NOT NULL,
	"case_id" uuid,
	"type" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "care_cases" ADD COLUMN "escalated_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "care_cases" ADD COLUMN "closure_plan" text;--> statement-breakpoint
ALTER TABLE "care_cases" ADD COLUMN "closure_evidence" text;--> statement-breakpoint
ALTER TABLE "care_cases" ADD COLUMN "closed_by" text;--> statement-breakpoint
ALTER TABLE "notifications" ADD COLUMN "patient_id" text;--> statement-breakpoint
UPDATE "notifications" n SET "patient_id" = c."patient_id" FROM "care_cases" c WHERE c."id" = n."case_id";--> statement-breakpoint
ALTER TABLE "notifications" ALTER COLUMN "patient_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "notifications" ADD COLUMN "kind" text DEFAULT 'case_alert' NOT NULL;--> statement-breakpoint
ALTER TABLE "notifications" ADD COLUMN "read_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "notifications" ADD COLUMN "next_attempt_at" timestamp with time zone;--> statement-breakpoint
UPDATE "notifications" SET "read_at" = "sent_at", "status" = 'read' WHERE "status" = 'delivered';--> statement-breakpoint
ALTER TABLE "case_messages" ADD CONSTRAINT "case_messages_case_id_care_cases_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."care_cases"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mobile_events" ADD CONSTRAINT "mobile_events_case_id_care_cases_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."care_cases"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "case_messages_case_idx" ON "case_messages" USING btree ("case_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "device_tokens_token_idx" ON "device_tokens" USING btree ("token");--> statement-breakpoint
CREATE INDEX "device_tokens_patient_idx" ON "device_tokens" USING btree ("patient_id");--> statement-breakpoint
CREATE INDEX "mobile_events_patient_idx" ON "mobile_events" USING btree ("patient_id","created_at");--> statement-breakpoint
CREATE INDEX "notifications_status_idx" ON "notifications" USING btree ("status","next_attempt_at");