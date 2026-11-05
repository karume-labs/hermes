import { careCases } from "@db/care-loop/schema/index";
import { db } from "@db/client";
import type { SeedContext } from "@db/seed/types";
import { Type } from "@sinclair/typebox";
import { Value } from "@sinclair/typebox/value";
import templates from "./data.json";

const CaseTemplate = Type.Object({
  patientId: Type.String(),
  severity: Type.Union([
    Type.Literal("Routine"),
    Type.Literal("Actionable"),
    Type.Literal("Urgent"),
  ]),
  status: Type.Union([
    Type.Literal("received"),
    Type.Literal("notified"),
    Type.Literal("acknowledged"),
    Type.Literal("escalated"),
  ]),
  slaHours: Type.Number(),
  summary: Type.String(),
  acknowledged: Type.Boolean(),
});

const hours = (value: number): number => value * 3600 * 1000;
const cases = Value.Parse(Type.Array(CaseTemplate), templates.cases);

// Idempotent: bails once cases exist so `db:seed` is safe to rerun.
export const seedCareLoop = async (context: SeedContext): Promise<number> => {
  const existing = await db
    .select({ id: careCases.id })
    .from(careCases)
    .limit(1);
  if (existing.length > 0) return 0;

  const rows = context.clinics.flatMap((clinic) =>
    cases.map((template) => {
      const createdAt = new Date(
        context.now.getTime() - hours(template.slaHours / 2),
      );
      return {
        patientId: `${template.patientId}-${clinic.id}`,
        clinicId: clinic.id,
        labPayloadId: `seed-lab-${template.patientId}-${clinic.id}`,
        severity: template.severity,
        status: template.status,
        slaDueAt: new Date(createdAt.getTime() + hours(template.slaHours)),
        summaryPlainLanguage: template.summary,
        acknowledgedAt: template.acknowledged ? new Date(context.now) : null,
      };
    }),
  );

  await db.insert(careCases).values(rows);
  return rows.length;
};
