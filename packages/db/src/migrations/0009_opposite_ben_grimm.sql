ALTER TABLE "patients" DROP COLUMN "language";--> statement-breakpoint
-- Named ownership: every open case gets a clinic owner. Coordinators are
-- preferred because they run outreach, then clinicians; admins are not owners.
UPDATE "care_cases" AS c
SET "assigned_to_id" = (
  SELECT u."id"
  FROM "user" AS u
  WHERE u."clinic_id" = c."clinic_id"
    AND u."banned" = false
    AND u."role" IN ('coordinator', 'clinician')
  ORDER BY
    CASE WHEN u."role" = 'coordinator' THEN 0 ELSE 1 END,
    u."created_at",
    u."id"
  LIMIT 1
)
WHERE c."assigned_to_id" IS NULL AND c."status" <> 'closed';
