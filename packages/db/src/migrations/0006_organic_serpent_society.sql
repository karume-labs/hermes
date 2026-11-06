CREATE TABLE "webhook_receipts" (
	"id" text PRIMARY KEY NOT NULL,
	"source" text NOT NULL,
	"received_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "staff_invites" ADD COLUMN "name" text NOT NULL;--> statement-breakpoint
CREATE INDEX "webhook_receipts_received_idx" ON "webhook_receipts" USING btree ("received_at");--> statement-breakpoint
INSERT INTO "clinics" ("id", "name")
SELECT DISTINCT "clinic_id", initcap(replace("clinic_id", '-', ' ')) FROM "routing_rules"
ON CONFLICT ("id") DO NOTHING;--> statement-breakpoint
ALTER TABLE "routing_rules" ADD CONSTRAINT "routing_rules_clinic_id_clinics_id_fk" FOREIGN KEY ("clinic_id") REFERENCES "public"."clinics"("id") ON DELETE restrict ON UPDATE no action;