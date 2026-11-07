import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { bookingsRouter } from "@api/features/booking/routers/bookings-router";
import { recordBookingOutcome } from "@api/features/booking/services/booking-outcome";
import {
  bookSlot,
  findBooking,
} from "@api/features/booking/services/booking-repository";
import { ensureSlots } from "@api/features/booking/services/slot-service";
import { findCase } from "@api/features/care-loop/services/case-repository";
import {
  generateSessionToken,
  hashToken,
} from "@api/features/patient-auth/services/tokens";
import { errorHandlerPlugin } from "@api/features/shared/errors/index";
import { slots } from "@db/booking/schema/index";
import { careCases } from "@db/care-loop/schema/index";
import { db } from "@db/client";
import { patientSessions } from "@db/patient/schema/index";
import { eq } from "drizzle-orm";
import { Elysia } from "elysia";
import {
  type CareLoopFixtures,
  createFixtures,
} from "./helpers/care-loop-fixtures";

const app = new Elysia().use(errorHandlerPlugin).use(bookingsRouter);

const nextFreeSlot = async (clinicId: string) => {
  const available = (await ensureSlots(clinicId)).filter(
    (slot) => slot.heldByCaseId === null,
  );
  const slot = available[0];
  if (slot === undefined) throw new Error("No test slot available");
  return slot;
};

describe("appointment lifecycle", () => {
  let fixtures: CareLoopFixtures;
  let token: string;

  beforeAll(async () => {
    fixtures = await createFixtures("booking");
    token = generateSessionToken();
    await db.insert(patientSessions).values({
      patientId: fixtures.patientId,
      tokenHash: hashToken(token),
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    });
  });

  afterAll(async () => {
    await fixtures.cleanup();
  });

  test("a patient can cancel an upcoming visit", async () => {
    const caseRow = await fixtures.createCase();
    await db
      .update(careCases)
      .set({ acknowledgedAt: new Date() })
      .where(eq(careCases.id, caseRow.id));
    const slot = await nextFreeSlot(fixtures.clinicA);
    const booking = await bookSlot({
      caseId: caseRow.id,
      slotId: slot.id,
    });

    const response = await app.handle(
      new Request(`http://localhost/bookings/${booking.id}/cancel`, {
        method: "POST",
        headers: {
          authorization: `Bearer ${token}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({ reason: "Transport fell through" }),
      }),
    );

    expect(response.status).toBe(200);
    expect((await findBooking(booking.id))?.status).toBe("cancelled");
    expect((await findCase(caseRow.id))?.status).toBe("acknowledged");
  });

  test("a patient can move a confirmed visit to another slot", async () => {
    const caseRow = await fixtures.createCase();
    const original = await nextFreeSlot(fixtures.clinicA);
    const booking = await bookSlot({
      caseId: caseRow.id,
      slotId: original.id,
    });
    const replacement = await nextFreeSlot(fixtures.clinicA);

    const response = await app.handle(
      new Request(`http://localhost/bookings/${booking.id}/reschedule`, {
        method: "POST",
        headers: {
          authorization: `Bearer ${token}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          slotId: replacement.id,
          kind: replacement.kind,
        }),
      }),
    );

    expect(response.status).toBe(200);
    const moved = (await response.json()) as { slotId: string };
    expect(moved.slotId).toBe(replacement.id);
    expect((await findBooking(booking.id))?.status).toBe("cancelled");
    expect((await findCase(caseRow.id))?.status).toBe("appointment_booked");
  });

  test("staff can mark a started visit attended or missed", async () => {
    const attendedCase = await fixtures.createCase();
    const attendedSlot = await nextFreeSlot(fixtures.clinicA);
    const attendedBooking = await bookSlot({
      caseId: attendedCase.id,
      slotId: attendedSlot.id,
    });
    await db
      .update(slots)
      .set({ startAt: new Date(Date.now() - 30 * 60 * 1000) })
      .where(eq(slots.id, attendedSlot.id));

    const attended = await recordBookingOutcome(
      fixtures.clinicA,
      attendedBooking.id,
      "attended",
    );
    expect(attended?.status).toBe("attended");

    const missedCase = await fixtures.createCase();
    const missedSlot = await nextFreeSlot(fixtures.clinicA);
    const missedBooking = await bookSlot({
      caseId: missedCase.id,
      slotId: missedSlot.id,
    });
    await db
      .update(slots)
      .set({ startAt: new Date(Date.now() - 30 * 60 * 1000) })
      .where(eq(slots.id, missedSlot.id));

    const missed = await recordBookingOutcome(
      fixtures.clinicA,
      missedBooking.id,
      "no_show",
    );
    expect(missed?.status).toBe("no_show");
  });

  test("another clinic cannot record the outcome", async () => {
    const caseRow = await fixtures.createCase();
    const slot = await nextFreeSlot(fixtures.clinicA);
    const booking = await bookSlot({
      caseId: caseRow.id,
      slotId: slot.id,
    });
    await db
      .update(slots)
      .set({ startAt: new Date(Date.now() - 30 * 60 * 1000) })
      .where(eq(slots.id, slot.id));

    expect(
      await recordBookingOutcome(fixtures.clinicB, booking.id, "attended"),
    ).toBeNull();
  });
});
