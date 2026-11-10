import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { bookSlot } from "@api/features/booking/services/booking-repository";
import { queueVisitReminders } from "@api/features/booking/services/reminder-service";
import { ensureSlots } from "@api/features/booking/services/slot-service";
import { bookings, slots } from "@db/booking/schema/index";
import { careCases } from "@db/care-loop/schema/index";
import { db } from "@db/client";
import { notifications } from "@db/notify/schema/index";
import { and, eq, inArray } from "drizzle-orm";
import {
  type CareLoopFixtures,
  createFixtures,
} from "./helpers/care-loop-fixtures";

const hoursFromNow = (count: number): Date =>
  new Date(Date.now() + count * 60 * 60 * 1000);

let fixtures: CareLoopFixtures;
const caseIds: string[] = [];

const nextFreeSlot = async (exceptId?: string) => {
  const free = (await ensureSlots(fixtures.clinicA)).filter(
    (slot) =>
      slot.heldByCaseId === null &&
      slot.id !== exceptId &&
      new Date(slot.startAt).getTime() > Date.now(),
  );
  const slot = free[0];
  if (slot === undefined) throw new Error("No test slot available");
  return slot;
};

const reminderCount = async (caseId: string): Promise<number> => {
  const rows = await db
    .select({ id: notifications.id })
    .from(notifications)
    .where(
      and(
        eq(notifications.caseId, caseId),
        eq(notifications.kind, "visit_reminder"),
      ),
    );
  return rows.length;
};

// One reminder per booking, not one per case: a rescheduled or follow-up visit
// must still remind the patient.
describe("visit reminders", () => {
  beforeAll(async () => {
    fixtures = await createFixtures("reminders");
  });

  afterAll(async () => {
    if (caseIds.length > 0) {
      await db
        .delete(notifications)
        .where(inArray(notifications.caseId, caseIds));
      await db.delete(bookings).where(inArray(bookings.caseId, caseIds));
      await db.delete(careCases).where(inArray(careCases.id, caseIds));
    }
    await db.delete(slots).where(eq(slots.clinicId, fixtures.clinicA));
    await fixtures.cleanup();
  });

  test("a booking inside the window is reminded once", async () => {
    const careCase = await fixtures.createCase();
    caseIds.push(careCase.id);
    const slot = await nextFreeSlot();
    const startAt = hoursFromNow(10);
    await db.update(slots).set({ startAt }).where(eq(slots.id, slot.id));
    await bookSlot({ caseId: careCase.id, slotId: slot.id });

    expect(await queueVisitReminders(new Date())).toBeGreaterThanOrEqual(1);
    expect(await reminderCount(careCase.id)).toBe(1);

    // A second tick in the same window must not send it again.
    await queueVisitReminders(new Date());
    expect(await reminderCount(careCase.id)).toBe(1);
  });

  test("a rescheduled visit earns its own reminder", async () => {
    const careCase = await fixtures.createCase();
    caseIds.push(careCase.id);
    const first = await nextFreeSlot();
    await db
      .update(slots)
      .set({ startAt: hoursFromNow(8) })
      .where(eq(slots.id, first.id));
    const booking = await bookSlot({ caseId: careCase.id, slotId: first.id });
    await queueVisitReminders(new Date());
    expect(await reminderCount(careCase.id)).toBe(1);

    // Same case, new visit: free the first slot and move the person.
    await db
      .update(bookings)
      .set({ status: "cancelled" })
      .where(eq(bookings.id, booking.id));
    await db
      .update(slots)
      .set({ heldByCaseId: null })
      .where(eq(slots.id, first.id));
    const second = await nextFreeSlot(first.id);
    await db
      .update(slots)
      .set({ startAt: hoursFromNow(20) })
      .where(eq(slots.id, second.id));
    await bookSlot({ caseId: careCase.id, slotId: second.id });

    await queueVisitReminders(new Date());
    expect(await reminderCount(careCase.id)).toBe(2);
  });

  test("a slot outside 24 hours is left alone", async () => {
    const careCase = await fixtures.createCase();
    caseIds.push(careCase.id);
    const slot = await nextFreeSlot();
    await db
      .update(slots)
      .set({ startAt: hoursFromNow(48) })
      .where(eq(slots.id, slot.id));
    await bookSlot({ caseId: careCase.id, slotId: slot.id });

    const queued = await queueVisitReminders(new Date());
    expect(await reminderCount(careCase.id)).toBe(0);
    expect(queued).toBeGreaterThanOrEqual(0);
  });
});
