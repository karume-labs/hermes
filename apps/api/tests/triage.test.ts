import { describe, expect, test } from "bun:test";
import {
  gradeSeverity,
  isUnacknowledgedBeyond,
  plainLanguageSummary,
  slaDueAt,
} from "@api/features/care-loop/services/triage";

describe("triage", () => {
  test("grades urgent glucose", () => {
    expect(gradeSeverity("glucose_fasting", 220)).toBe("Urgent");
  });
  test("grades actionable LDL", () => {
    expect(gradeSeverity("ldl", 195)).toBe("Actionable");
  });
  test("routine by default", () => {
    expect(gradeSeverity("hdl", 55)).toBe("Routine");
  });
  test("grades electrolyte and cardiac markers", () => {
    expect(gradeSeverity("potassium", 6.4)).toBe("Urgent");
    expect(gradeSeverity("potassium", 5.5)).toBe("Actionable");
    expect(gradeSeverity("troponin", 0.9)).toBe("Urgent");
    expect(gradeSeverity("creatinine", 2.4)).toBe("Actionable");
  });
  test("grades LOINC-coded lab feeds", () => {
    expect(gradeSeverity("4548-4", 9.6)).toBe("Urgent");
    expect(gradeSeverity("2823-3", 5.9)).toBe("Actionable");
    expect(gradeSeverity("13457-7", 120)).toBe("Routine");
  });

  test("summaries use the patient-facing marker label", () => {
    const summary = plainLanguageSummary("4548-4", 9.6, "%", "Urgent");
    expect(summary).toContain("HbA1c");
    expect(summary).not.toContain("4548-4");
  });

  test("SLA windows match docs", () => {
    const from = new Date("2026-01-01T00:00:00Z");
    expect(slaDueAt("Urgent", from).toISOString()).toBe(
      "2026-01-01T04:00:00.000Z",
    );
    expect(slaDueAt("Actionable", from).toISOString()).toBe(
      "2026-01-03T00:00:00.000Z",
    );
  });
  test("48h unacknowledged flag", () => {
    const created = new Date("2026-01-01T00:00:00Z");
    expect(
      isUnacknowledgedBeyond(created, 48, new Date("2026-01-03T01:00:00Z")),
    ).toBe(true);
    expect(
      isUnacknowledgedBeyond(created, 48, new Date("2026-01-02T00:00:00Z")),
    ).toBe(false);
  });
});
