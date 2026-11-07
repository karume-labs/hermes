import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { patientsRouter } from "@api/features/patient/routers/patients-router";
import {
  generateSessionToken,
  hashToken,
} from "@api/features/patient-auth/services/tokens";
import { errorHandlerPlugin } from "@api/features/shared/errors/index";
import { db } from "@db/client";
import { patients } from "@db/directory/schema/index";
import { notifications } from "@db/notify/schema/index";
import { patientSessions } from "@db/patient/schema/index";
import { eq, inArray } from "drizzle-orm";
import { Elysia } from "elysia";
import {
  type CareLoopFixtures,
  createFixtures,
} from "./helpers/care-loop-fixtures";

const app = new Elysia().use(errorHandlerPlugin).use(patientsRouter);

interface NotificationBody {
  id: string;
  caseId: string;
  kind: string;
  status: string;
  readAt: string | null;
}

describe("patient notification centre", () => {
  let fixtures: CareLoopFixtures;
  let token: string;
  let caseId: string;
  let alertId: string;
  const otherPatientId = `itest-other-patient-${Date.now()}`;
  let otherAlertId: string;

  const queue = async (patientId: string, kind: "case_alert") => {
    const [row] = await db
      .insert(notifications)
      .values({
        caseId,
        patientId,
        channel: "in_app",
        kind,
        status: "sent",
        payload: { text: "A new result is ready in Hermes Care." },
      })
      .returning();
    if (row === undefined) throw new Error("Notification insert failed");
    return row.id;
  };

  const call = (path: string, method = "GET", bearer = token) =>
    app.handle(
      new Request(`http://localhost${path}`, {
        method,
        headers: {
          authorization: `Bearer ${bearer}`,
          "content-type": "application/json",
        },
      }),
    );

  beforeAll(async () => {
    fixtures = await createFixtures("notify");
    token = generateSessionToken();
    await db.insert(patientSessions).values({
      patientId: fixtures.patientId,
      tokenHash: hashToken(token),
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    });
    await db.insert(patients).values({
      id: otherPatientId,
      clinicId: fixtures.clinicA,
      name: "Other Test Patient",
      phone: `+2548${String(Date.now()).slice(-8)}`,
    });

    const caseRow = await fixtures.createCase();
    caseId = caseRow.id;
    alertId = await queue(fixtures.patientId, "case_alert");
    otherAlertId = await queue(otherPatientId, "case_alert");
  });

  afterAll(async () => {
    await db.delete(notifications).where(eq(notifications.caseId, caseId));
    await db
      .delete(patientSessions)
      .where(eq(patientSessions.patientId, fixtures.patientId));
    await db.delete(patients).where(inArray(patients.id, [otherPatientId]));
    await fixtures.cleanup();
  });

  test("a patient sees only their own notifications", async () => {
    const response = await call(
      `/patients/${fixtures.patientId}/notifications`,
    );
    expect(response.status).toBe(200);
    const rows = (await response.json()) as NotificationBody[];
    expect(rows).toHaveLength(1);
    expect(rows[0]?.id).toBe(alertId);
    expect(rows[0]?.kind).toBe("case_alert");
    expect(rows[0]?.readAt).toBeNull();
  });

  test("opening a notification marks it read", async () => {
    const marked = await call(
      `/patients/${fixtures.patientId}/notifications/${alertId}/read`,
      "POST",
    );
    expect(marked.status).toBe(200);

    const listed = await call(`/patients/${fixtures.patientId}/notifications`);
    const rows = (await listed.json()) as NotificationBody[];
    expect(rows[0]?.status).toBe("read");
    expect(rows[0]?.readAt).not.toBeNull();
  });

  test("another patient's alert cannot be marked read", async () => {
    const response = await call(
      `/patients/${fixtures.patientId}/notifications/${otherAlertId}/read`,
      "POST",
    );
    expect(response.status).toBe(404);

    const [row] = await db
      .select({ status: notifications.status })
      .from(notifications)
      .where(eq(notifications.id, otherAlertId));
    expect(row?.status).toBe("sent");
  });

  test("a patient path that is not the session owner is refused", async () => {
    const response = await call(`/patients/${otherPatientId}/notifications`);
    expect(response.status).toBe(404);
  });

  test("notifications require a patient session", async () => {
    const response = await app.handle(
      new Request(
        `http://localhost/patients/${fixtures.patientId}/notifications`,
      ),
    );
    expect(response.status).toBe(401);
  });
});
