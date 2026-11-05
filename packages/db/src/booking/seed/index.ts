import { slots } from "@db/booking/schema/index";
import { db } from "@db/client";
import type { SeedContext } from "@db/seed/types";
import { Type } from "@sinclair/typebox";
import { Value } from "@sinclair/typebox/value";
import data from "./data.json";

const BookingSeed = Type.Object({
  slotKinds: Type.Array(
    Type.Union([Type.Literal("in_person"), Type.Literal("telehealth")]),
  ),
  slotMinutes: Type.Number(),
  daysAhead: Type.Number(),
});

const hours = (value: number): number => value * 3600 * 1000;
const kinds = Value.Parse(BookingSeed, data).slotKinds;

export const seedBooking = async (context: SeedContext): Promise<number> => {
  const existing = await db.select({ id: slots.id }).from(slots).limit(1);
  if (existing.length > 0) return 0;

  const rows = context.clinics.flatMap((clinic) =>
    kinds.map((kind, index) => {
      const startAt = new Date(
        context.now.getTime() + (index + 1) * hours(data.daysAhead * 24),
      );
      return {
        id: `${clinic.id}-slot-${index + 1}`,
        clinicId: clinic.id,
        startAt,
        endAt: new Date(startAt.getTime() + data.slotMinutes * 60 * 1000),
        kind,
      };
    }),
  );

  await db.insert(slots).values(rows).onConflictDoNothing();
  return rows.length;
};
