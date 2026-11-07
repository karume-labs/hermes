import { auditTrail, careCases } from "@db/care-loop/schema/index";
import { db } from "@db/client";
import { patients } from "@db/directory/schema/index";
import type { SeedContext } from "@db/seed/types";
import { Type } from "@sinclair/typebox";
import { Value } from "@sinclair/typebox/value";
import data from "./data.json";
import { generateCaseHistory } from "./generate";

// Mirrors `SLA_HOURS` in the API's triage service. Kept here so the fixtures
// grade the same way a live payload would.
const SLA_HOURS = { Routine: 168, Actionable: 48, Urgent: 4 } as const;

const hours = (value: number): number => value * 3600 * 1000;

const CaseTemplate = Type.Object({
  slug: Type.String(),
  patientId: Type.String(),
  clinicId: Type.String(),
  severity: Type.Union([
    Type.Literal("Routine"),
    Type.Literal("Actionable"),
    Type.Literal("Urgent"),
  ]),
  status: Type.Union([
    Type.Literal("received"),
    Type.Literal("triaged"),
    Type.Literal("notified"),
    Type.Literal("acknowledged"),
    Type.Literal("appointment_booked"),
    Type.Literal("referred"),
    Type.Literal("escalated"),
    Type.Literal("closed"),
  ]),
  createdHoursAgo: Type.Number(),
  acknowledgedHoursAgo: Type.Union([Type.Number(), Type.Null()]),
  escalatedHoursAgo: Type.Optional(Type.Number()),
  closedHoursAgo: Type.Optional(Type.Number()),
  referralClinicId: Type.Optional(Type.String()),
  closurePlan: Type.Optional(Type.String()),
  closureEvidence: Type.Optional(Type.String()),
  closedBy: Type.Optional(Type.String()),
  summary: Type.String(),
});

const AuditTemplate = Type.Object({
  slug: Type.String(),
  hoursAfterCase: Type.Number(),
  actor: Type.String(),
  action: Type.String(),
  detail: Type.Optional(Type.Record(Type.String(), Type.Unknown())),
});

const curated = Value.Parse(Type.Array(CaseTemplate), data.cases);
const curatedAudit = Value.Parse(Type.Array(AuditTemplate), data.audit);

const at = (context: SeedContext, hoursAgo: number): Date =>
  new Date(context.now.getTime() - hours(hoursAgo));

// Idempotent: bails once cases exist so `db:seed` is safe to rerun. Each case
// keeps a `seed-<slug>` lab payload id so downstream seeders can find it.
export const seedCareLoop = async (context: SeedContext): Promise<number> => {
  const existing = await db
    .select({ id: careCases.id })
    .from(careCases)
    .limit(1);
  if (existing.length > 0) return 0;

  // Working history on top of the curated demo cases, so filters, metrics and
  // the audit trail have enough spread to behave like a real clinic.
  const seededPatients = await db
    .select({ id: patients.id, clinicId: patients.clinicId })
    .from(patients);
  const history = generateCaseHistory({ patients: seededPatients });
  const cases = [...curated, ...history.cases];
  const audit = [...curatedAudit, ...history.audit];

  const createdAtBySlug = new Map<string, Date>();
  const rows = cases.map((template) => {
    const createdAt = at(context, template.createdHoursAgo);
    createdAtBySlug.set(template.slug, createdAt);
    return {
      patientId: template.patientId,
      clinicId: template.clinicId,
      labPayloadId: `seed-${template.slug}`,
      severity: template.severity,
      status: template.status,
      slaDueAt: new Date(
        createdAt.getTime() + hours(SLA_HOURS[template.severity]),
      ),
      summaryPlainLanguage: template.summary,
      acknowledgedAt:
        template.acknowledgedHoursAgo === null
          ? null
          : at(context, template.acknowledgedHoursAgo),
      escalatedAt:
        template.escalatedHoursAgo === undefined
          ? null
          : at(context, template.escalatedHoursAgo),
      closedAt:
        template.closedHoursAgo === undefined
          ? null
          : at(context, template.closedHoursAgo),
      referralClinicId: template.referralClinicId ?? null,
      closurePlan: template.closurePlan ?? null,
      closureEvidence: template.closureEvidence ?? null,
      closedBy: template.closedBy ?? null,
      createdAt,
      updatedAt: context.now,
    };
  });

  const inserted = await db.insert(careCases).values(rows).returning({
    id: careCases.id,
    labPayloadId: careCases.labPayloadId,
  });
  const idBySlug = new Map(
    inserted.map((row) => [row.labPayloadId.replace(/^seed-/, ""), row.id]),
  );

  const auditRows = audit.flatMap((entry) => {
    const caseId = idBySlug.get(entry.slug);
    const createdAt = createdAtBySlug.get(entry.slug);
    if (caseId === undefined || createdAt === undefined) return [];
    return [
      {
        caseId,
        actor: entry.actor,
        action: entry.action,
        detail: entry.detail ?? {},
        createdAt: new Date(createdAt.getTime() + hours(entry.hoursAfterCase)),
      },
    ];
  });

  if (auditRows.length > 0) await db.insert(auditTrail).values(auditRows);
  return rows.length + auditRows.length;
};
