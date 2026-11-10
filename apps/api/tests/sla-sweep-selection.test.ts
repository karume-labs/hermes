import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import {
  listCasesNeedingEscalation,
  listSurveillanceDue,
  updateCase,
} from "@api/features/care-loop/services/case-repository";
import {
  type CareLoopFixtures,
  createFixtures,
} from "./helpers/care-loop-fixtures";

let fixtures: CareLoopFixtures;

const hours = (count: number): Date =>
  new Date(Date.now() + count * 60 * 60 * 1000);

// The cron must not scan every case ever recorded, so these two queries decide
// what needs attention; a regression here silently stops escalation.
describe("sla sweep selection", () => {
  beforeAll(async () => {
    fixtures = await createFixtures("sla-selection");
  });

  afterAll(async () => {
    await fixtures.cleanup();
  });

  test("an open case past its deadline is selected", async () => {
    const careCase = await fixtures.createCase();
    await updateCase(careCase.id, { slaDueAt: hours(-1) });

    const due = await listCasesNeedingEscalation(new Date());
    expect(due.map((row) => row.id)).toContain(careCase.id);
  });

  test("a case inside its deadline is not selected", async () => {
    const careCase = await fixtures.createCase();

    const due = await listCasesNeedingEscalation(new Date());
    expect(due.map((row) => row.id)).not.toContain(careCase.id);
  });

  test("an unacknowledged routine case is selected only after 168 hours", async () => {
    const careCase = await fixtures.createCase({ status: "notified" });
    await updateCase(careCase.id, {
      slaDueAt: hours(100),
      acknowledgedAt: null,
    });

    const early = await listCasesNeedingEscalation(hours(1));
    expect(early.map((row) => row.id)).not.toContain(careCase.id);

    const late = await listCasesNeedingEscalation(hours(169));
    expect(late.map((row) => row.id)).toContain(careCase.id);
  });

  test("a closed case is never selected", async () => {
    const careCase = await fixtures.createCase();
    await updateCase(careCase.id, {
      status: "closed",
      slaDueAt: hours(-1),
      nextReviewAt: hours(-1),
    });

    const due = await listCasesNeedingEscalation(new Date());
    const reviews = await listSurveillanceDue(new Date());
    expect(due.map((row) => row.id)).not.toContain(careCase.id);
    expect(reviews.map((row) => row.id)).not.toContain(careCase.id);
  });

  test("a surveillance review is selected when its date arrives", async () => {
    const careCase = await fixtures.createCase({ nextReviewAt: hours(-2) });

    const reviews = await listSurveillanceDue(new Date());
    expect(reviews.map((row) => row.id)).toContain(careCase.id);

    const notYet = await listSurveillanceDue(hours(-3));
    expect(notYet.map((row) => row.id)).not.toContain(careCase.id);
  });
});
