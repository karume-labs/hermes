import { db } from "@db/client";
import { routingRules } from "@db/ingestion/schema/index";
import type { SeedContext } from "@db/seed/types";
import { Type } from "@sinclair/typebox";
import { Value } from "@sinclair/typebox/value";
import data from "./data.json";

const RoutingSeed = Type.Object({
  rules: Type.Array(
    Type.Object({
      markerPrefix: Type.String(),
      clinicId: Type.String(),
      active: Type.Optional(Type.Boolean()),
    }),
  ),
});

const parsed = Value.Parse(RoutingSeed, data);

export const seedRouting = async (_context: SeedContext): Promise<number> => {
  const existing = await db
    .select({ id: routingRules.id })
    .from(routingRules)
    .limit(1);
  if (existing.length > 0) return 0;

  const rows = parsed.rules.map((rule) => ({
    markerPrefix: rule.markerPrefix,
    clinicId: rule.clinicId,
    active: rule.active ?? true,
  }));
  await db.insert(routingRules).values(rows).onConflictDoNothing();
  return rows.length;
};
