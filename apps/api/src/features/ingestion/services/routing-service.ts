import { db } from "@db/client";
import { routingRules } from "@db/ingestion/schema/index";
import type { RoutingRule } from "@hermes/types";
import { asc, eq } from "drizzle-orm";

const toRule = (row: typeof routingRules.$inferSelect): RoutingRule => ({
  id: row.id,
  markerPrefix: row.markerPrefix,
  clinicId: row.clinicId,
  active: row.active,
  createdAt: row.createdAt.toISOString(),
  updatedAt: row.updatedAt.toISOString(),
});

export const listRoutingRules = async (
  clinicId: string | null = null,
): Promise<RoutingRule[]> => {
  const rows = await db
    .select()
    .from(routingRules)
    .where(clinicId === null ? undefined : eq(routingRules.clinicId, clinicId))
    .orderBy(asc(routingRules.markerPrefix));
  return rows.map(toRule);
};

export const upsertRoutingRule = async (input: {
  markerPrefix: string;
  clinicId: string;
  active?: boolean;
}): Promise<RoutingRule> => {
  const active = input.active ?? true;
  const [row] = await db
    .insert(routingRules)
    .values({
      markerPrefix: input.markerPrefix.toLowerCase(),
      clinicId: input.clinicId,
      active,
    })
    .onConflictDoUpdate({
      target: routingRules.markerPrefix,
      set: { clinicId: input.clinicId, active },
    })
    .returning();
  return toRule(row);
};

export const removeRoutingRule = async (id: string): Promise<boolean> => {
  const rows = await db
    .delete(routingRules)
    .where(eq(routingRules.id, id))
    .returning({ id: routingRules.id });
  return rows.length > 0;
};

// Longest matching prefix wins, so `ldl` can override a broader `lipid` rule.
export const resolveClinic = async (
  markerCode: string,
  fallbackClinicId: string,
): Promise<string> => {
  const rules = await listRoutingRules();
  const normalized = markerCode.toLowerCase();
  const matches = rules
    .filter((rule) => rule.active && normalized.includes(rule.markerPrefix))
    .sort((a, b) => b.markerPrefix.length - a.markerPrefix.length);
  return matches[0] === undefined ? fallbackClinicId : matches[0].clinicId;
};
