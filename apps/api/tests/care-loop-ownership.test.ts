import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import {
  bookSlot,
  findBooking,
} from "@api/features/booking/services/booking-repository";
import { ensureSlots } from "@api/features/booking/services/slot-service";
import { findCaseByLabPayloadId } from "@api/features/care-loop/services/case-repository";
import {
  acceptReferral,
  createReferral,
  declineReferral,
} from "@api/features/care-loop/services/referral-service";
import { ingestLab } from "@api/features/ingestion/services/ingest-service";
import { referralsRouter } from "@api/features/referral/routers/referrals-router";
import { env } from "@api/features/shared/env/index";
import { errorHandlerPlugin } from "@api/features/shared/errors/index";
import { caseTasks } from "@db/care-loop/schema/index";
import { db } from "@db/client";
import { and, eq } from "drizzle-orm";
import { Elysia } from "elysia";
import {
  type CareLoopFixtures,
  createFixtures,
  defaultAssigneeId,
  findOwnedCase,
} from "./helpers/care-loop-fixtures";

const app = new Elysia().use(errorHandlerPlugin).use(referralsRouter);

const callApi = (path: string, body: unknown) =>
  app.handle(
    new Request(`http://localhost${path}`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${env.API_SECRET}`,
        "content-type": "application/json",
      },
      body: JSON.stringify(body),
    }),
  );

const closeBody = (caseId: string) => ({
  caseId,
  evidence: "Repeat HbA1c confirmed the result and treatment started.",
  plan: "Review again in three months at the clinic.",
});

describe("named ownership and hand-off", () => {
  let fixtures: CareLoopFixtures;

  beforeAll(async () => {
    fixtures = await createFixtures("ownership");
  });

  afterAll(async () => {
    await fixtures.cleanup();
  });

  test("a new case gets the clinic coordinator as its owner", async () => {
    expect(await defaultAssigneeId(fixtures.clinicA)).toBe(
      fixtures.coordinatorId,
    );

    const sourceMessageId = `itest-ingest-${Date.now()}`;
    const result = await ingestLab({
      patientId: fixtures.patientId,
      markerCode: "4548-4",
      markerValue: 9.4,
      unit: "%",
      takenAt: new Date().toISOString(),
      facilityId: "itest-lab",
      sourceMessageId,
      clinicId: fixtures.clinicA,
    });
    const created = await findCaseByLabPayloadId(sourceMessageId);
    expect(result.duplicate).toBe(false);
    expect(created?.assignedToId).toBe(fixtures.coordinatorId);
  });

  test("closure is refused until the case has a named owner", async () => {
    const unowned = await fixtures.createCase({ assignedToId: null });
    const rejected = await callApi("/cases/close", closeBody(unowned.id));
    expect(rejected.status).toBe(409);

    const owned = await fixtures.createCase();
    const accepted = await callApi("/cases/close", closeBody(owned.id));
    expect(accepted.status).toBe(200);
    const closed = await findOwnedCase(owned.id);
    expect(closed.status).toBe("closed");
  });

  test("closing a booked case cancels the visit and stays closed", async () => {
    const caseRow = await fixtures.createCase();
    const [slot] = await ensureSlots(fixtures.clinicA);
    const booking = await bookSlot({
      caseId: caseRow.id,
      slotId: slot.id,
    });

    const accepted = await callApi("/cases/close", closeBody(caseRow.id));
    expect(accepted.status).toBe(200);

    const closed = await findOwnedCase(caseRow.id);
    expect(closed.status).toBe("closed");
    const released = await findBooking(booking.id);
    expect(released?.status).toBe("cancelled");
  });

  test("accepting a referral gives the receiving clinic a named owner", async () => {
    const caseRow = await fixtures.createCase();
    const referral = await createReferral(fixtures.coordinator, {
      caseId: caseRow.id,
      toClinicId: fixtures.clinicB,
      note: "Needs a specialist review at the receiving clinic.",
    });

    const accepted = await acceptReferral(fixtures.admin, referral.id, {});
    expect(accepted.status).toBe("accepted");

    const updated = await findOwnedCase(caseRow.id);
    expect(updated.assignedToId).toBe(fixtures.coordinatorBId);
    const open = await db
      .select()
      .from(caseTasks)
      .where(
        and(
          eq(caseTasks.caseId, caseRow.id),
          eq(caseTasks.kind, "referral"),
          eq(caseTasks.status, "open"),
        ),
      );
    expect(open).toHaveLength(0);
  });

  test("a declined referral returns the case with a re-route task", async () => {
    const caseRow = await fixtures.createCase();
    const referral = await createReferral(fixtures.coordinator, {
      caseId: caseRow.id,
      toClinicId: fixtures.clinicB,
      note: "Please take over this patient's follow-up care.",
    });

    await declineReferral(
      fixtures.admin,
      referral.id,
      "No capacity this month",
    );

    const updated = await findOwnedCase(caseRow.id);
    expect(updated.status).toBe("acknowledged");
    expect(updated.assignedToId).toBe(fixtures.coordinatorId);
    const [reroute] = await db
      .select()
      .from(caseTasks)
      .where(
        and(
          eq(caseTasks.caseId, caseRow.id),
          eq(caseTasks.kind, "referral"),
          eq(caseTasks.status, "open"),
        ),
      );
    expect(reroute?.assignedToId).toBe(fixtures.coordinatorId);
    expect(reroute?.title).toContain("declined");
  });
});
