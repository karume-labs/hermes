import { bookings, slots } from "@db/booking/schema/index";
import { careCases } from "@db/care-loop/schema/index";
import { db } from "@db/client";
import type { SeedContext } from "@db/seed/types";
import { Type } from "@sinclair/typebox";
import { Value } from "@sinclair/typebox/value";
import { eq, inArray } from "drizzle-orm";
import data from "./data.json";

const SlotPattern = Type.Object({
  dayOffset: Type.Number(),
  time: Type.String(),
  kind: Type.Union([Type.Literal("in_person"), Type.Literal("telehealth")]),
});

const HistorySlot = Type.Object({
  clinicId: Type.String(),
  time: Type.String(),
  daysAgo: Type.Number(),
});

const BookingFixture = Type.Object({
  caseSlug: Type.String(),
  slotId: Type.String(),
  status: Type.Union([
    Type.Literal("held"),
    Type.Literal("confirmed"),
    Type.Literal("attended"),
    Type.Literal("cancelled"),
    Type.Literal("no_show"),
  ]),
  bookedHoursAfterCase: Type.Number(),
  prepInstructions: Type.String(),
});

const pattern = Value.Parse(Type.Array(SlotPattern), data.slotPattern);
const history = Value.Parse(Type.Array(HistorySlot), data.historySlots);
const fixtures = Value.Parse(Type.Array(BookingFixture), data.bookings);

const atTime = (day: Date, time: string): Date => {
  const [hour, minute] = time.split(":").map(Number);
  const value = new Date(day);
  value.setHours(hour, minute, 0, 0);
  return value;
};

const dayFrom = (context: SeedContext, offsetDays: number): Date => {
  const day = new Date(context.now);
  day.setDate(day.getDate() + offsetDays);
  return day;
};

// Availability repeats per clinic: half-hour visits across the next three
// days, plus a few past slots so attended and cancelled bookings have a home.
const buildSlots = (context: SeedContext) => {
  const rows = context.clinics.flatMap((clinic) =>
    pattern.map((slot, index) => {
      const startAt = atTime(dayFrom(context, slot.dayOffset), slot.time);
      return {
        id: `${clinic.id}-slot-${index + 1}`,
        clinicId: clinic.id,
        startAt,
        endAt: new Date(startAt.getTime() + data.slotMinutes * 60 * 1000),
        kind: slot.kind,
      };
    }),
  );

  const historic = history.map((slot, index) => {
    const startAt = atTime(dayFrom(context, -slot.daysAgo), slot.time);
    return {
      id: `${slot.clinicId}-slot-h${index + 1}`,
      clinicId: slot.clinicId,
      startAt,
      endAt: new Date(startAt.getTime() + data.slotMinutes * 60 * 1000),
      kind: "in_person" as const,
    };
  });

  return [...rows, ...historic];
};

// Idempotent: bails once slots exist so `db:seed` is safe to rerun.
export const seedBooking = async (context: SeedContext): Promise<number> => {
  const existing = await db.select({ id: slots.id }).from(slots).limit(1);
  if (existing.length > 0) return 0;

  const slotRows = buildSlots(context);
  await db.insert(slots).values(slotRows).onConflictDoNothing();

  const slugs = fixtures.map((fixture) => `seed-${fixture.caseSlug}`);
  const cases = await db
    .select({
      id: careCases.id,
      labPayloadId: careCases.labPayloadId,
      createdAt: careCases.createdAt,
    })
    .from(careCases)
    .where(inArray(careCases.labPayloadId, slugs));
  const caseBySlug = new Map(
    cases.map((row) => [row.labPayloadId.replace(/^seed-/, ""), row]),
  );

  const bookingRows = fixtures.flatMap((fixture) => {
    const careCase = caseBySlug.get(fixture.caseSlug);
    if (careCase === undefined) return [];
    const createdAt = new Date(
      careCase.createdAt.getTime() + fixture.bookedHoursAfterCase * 3600 * 1000,
    );
    return [
      {
        caseId: careCase.id,
        slotId: fixture.slotId,
        status: fixture.status,
        prepInstructions: fixture.prepInstructions,
        createdAt,
      },
    ];
  });

  const inserted = await db.insert(bookings).values(bookingRows).returning({
    id: bookings.id,
    caseId: bookings.caseId,
    slotId: bookings.slotId,
  });

  for (const booking of inserted) {
    await db
      .update(careCases)
      .set({ appointmentId: booking.id })
      .where(eq(careCases.id, booking.caseId));
    await db
      .update(slots)
      .set({ heldByCaseId: booking.caseId })
      .where(eq(slots.id, booking.slotId));
  }

  return slotRows.length + inserted.length;
};
