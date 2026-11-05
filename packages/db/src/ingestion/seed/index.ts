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

  await db.insert(routingRules).values(parsed.rules).onConflictDoNothing();
  return parsed.rules.length;
};
