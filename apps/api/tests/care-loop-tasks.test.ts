import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { getCaseDetail } from "@api/features/care-loop/services/case-detail";
import { patientsRouter } from "@api/features/patient/routers/patients-router";
import {
  generateSessionToken,
  hashToken,
} from "@api/features/patient-auth/services/tokens";
import { queueSurveillanceReviews } from "@api/features/shared/services/sla-sweep";
import { caseConsultNotes, caseTasks } from "@db/care-loop/schema/index";
import { db } from "@db/client";
import { patientSessions } from "@db/patient/schema/index";
import { and, eq } from "drizzle-orm";
import { Elysia } from "elysia";
import {
  type CareLoopFixtures,
  createFixtures,
} from "./helpers/care-loop-fixtures";

const app = new Elysia().use(patientsRouter);

const openTasks = async (caseId: string, kind: "patient_followup") =>
  db
    .select()
    .from(caseTasks)
    .where(
      and(
        eq(caseTasks.caseId, caseId),
        eq(caseTasks.kind, kind),
        eq(caseTasks.status, "open"),
      ),
    );

describe("surveillance, teach-back and consult visibility", () => {
  let fixtures: CareLoopFixtures;
  let token: string;

  beforeAll(async () => {
    fixtures = await createFixtures("tasks");
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

  test("a due surveillance date creates one review task", async () => {
    const reviewedAt = new Date(Date.now() - 60 * 60 * 1000);
    const caseRow = await fixtures.createCase({
      nextReviewAt: reviewedAt,
      status: "notified",
    });

    await queueSurveillanceReviews([caseRow], new Date());
    await queueSurveillanceReviews([caseRow], new Date());

    const reviews = await db
      .select()
      .from(caseTasks)
      .where(
        and(
          eq(caseTasks.caseId, caseRow.id),
          eq(caseTasks.kind, "surveillance_review"),
        ),
      );
    expect(reviews).toHaveLength(1);
    expect(reviews[0]?.assignedToId).toBe(fixtures.coordinatorId);
    expect(reviews[0]?.dueAt?.toISOString()).toBe(reviewedAt.toISOString());
  });

  test("negative teach-back opens a follow-up and positive closes it", async () => {
    const caseRow = await fixtures.createCase();
    const path = `/patients/${fixtures.patientId}/cases/${caseRow.id}/feedback`;
    const send = (understood: boolean) =>
      app.handle(
        new Request(`http://localhost${path}`, {
          method: "POST",
          headers: {
            authorization: `Bearer ${token}`,
            "content-type": "application/json",
          },
          body: JSON.stringify({
            understood,
            confidence: understood ? 4 : 2,
            comment: understood ? "Clear now." : "Still not sure what to do.",
          }),
        }),
      );

    expect((await send(false)).status).toBe(200);
    const raised = await openTasks(caseRow.id, "patient_followup");
    expect(raised).toHaveLength(1);
    expect(raised[0]?.assignedToId).toBe(fixtures.coordinatorId);

    expect((await send(true)).status).toBe(200);
    expect(await openTasks(caseRow.id, "patient_followup")).toHaveLength(0);
  });

  test("coordinators do not receive the internal consult thread", async () => {
    const caseRow = await fixtures.createCase();
    await db.insert(caseConsultNotes).values({
      caseId: caseRow.id,
      authorId: fixtures.clinicianId,
      authorName: "Test Clinician",
      authorRole: "clinician",
      body: "Internal note: repeat the panel before changing treatment.",
    });

    const coordinatorView = await getCaseDetail(
      caseRow.id,
      fixtures.coordinator,
    );
    const clinicianView = await getCaseDetail(caseRow.id, fixtures.clinician);
    expect(coordinatorView?.consultNotes).toHaveLength(0);
    expect(clinicianView?.consultNotes).toHaveLength(1);
  });
});
