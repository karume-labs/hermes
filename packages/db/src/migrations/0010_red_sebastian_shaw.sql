CREATE TABLE "case_clinicians" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"case_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"clinic_id" text NOT NULL,
	"access" text DEFAULT 'collaborator' NOT NULL,
	"granted_by" text,
	"granted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"revoked_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "organizations" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "email_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"recipient" varchar(320) NOT NULL,
	"subject" varchar(200) NOT NULL,
	"kind" varchar(60) NOT NULL,
	"status" varchar(16) NOT NULL,
	"error" text,
	"skip_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "patients" ALTER COLUMN "clinic_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "staff_invites" ADD COLUMN "organization_id" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "organization_id" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "notification_channel" text DEFAULT 'both' NOT NULL;--> statement-breakpoint
ALTER TABLE "case_referrals" ADD COLUMN "from_user_id" text;--> statement-breakpoint
ALTER TABLE "case_referrals" ADD COLUMN "to_user_id" text;--> statement-breakpoint
ALTER TABLE "clinics" ADD COLUMN "organization_id" text;--> statement-breakpoint
ALTER TABLE "patients" ADD COLUMN "email_consent" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "patients" ADD COLUMN "notification_channel" text DEFAULT 'in_app' NOT NULL;--> statement-breakpoint
ALTER TABLE "patients" ADD COLUMN "self_registered_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "case_clinicians" ADD CONSTRAINT "case_clinicians_case_id_care_cases_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."care_cases"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "case_clinicians" ADD CONSTRAINT "case_clinicians_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "case_clinicians" ADD CONSTRAINT "case_clinicians_clinic_id_clinics_id_fk" FOREIGN KEY ("clinic_id") REFERENCES "public"."clinics"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "case_clinicians_case_user_idx" ON "case_clinicians" USING btree ("case_id","user_id");--> statement-breakpoint
CREATE INDEX "case_clinicians_user_idx" ON "case_clinicians" USING btree ("user_id","revoked_at");--> statement-breakpoint
CREATE INDEX "email_logs_recipient_idx" ON "email_logs" USING btree ("recipient","created_at");--> statement-breakpoint
CREATE INDEX "email_logs_status_idx" ON "email_logs" USING btree ("status","created_at");--> statement-breakpoint
ALTER TABLE "staff_invites" ADD CONSTRAINT "staff_invites_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user" ADD CONSTRAINT "user_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinics" ADD CONSTRAINT "clinics_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "case_referrals_to_user_idx" ON "case_referrals" USING btree ("to_user_id","status");--> statement-breakpoint
CREATE INDEX "clinics_organization_idx" ON "clinics" USING btree ("organization_id");--> statement-breakpoint
CREATE UNIQUE INDEX "patients_email_org_idx" ON "patients" USING btree ("email","clinic_id");