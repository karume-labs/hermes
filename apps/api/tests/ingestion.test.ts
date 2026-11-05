import { describe, expect, test } from "bun:test";
import { fromFhirObservation } from "@api/features/ingestion/services/fhir";
import {
  parseHl7DateTime,
  parseHl7Oru,
} from "@api/features/ingestion/services/hl7";

const observation = {
  resourceType: "Observation" as const,
  id: "obs-123",
  code: {
    coding: [{ system: "http://loinc.org", code: "4548-4" }],
    text: "HbA1c",
  },
  subject: { reference: "Patient/patient-1-clinic-1" },
  performer: [{ reference: "Organization/lab-alpha" }],
  valueQuantity: { value: 9.4, unit: "%" },
  effectiveDateTime: "2026-10-01T09:00:00Z",
};

describe("FHIR ingestion mapping", () => {
  test("maps an Observation to a canonical lab", () => {
    expect(fromFhirObservation(observation)).toEqual({
      patientId: "patient-1-clinic-1",
      markerCode: "4548-4",
      markerValue: 9.4,
      unit: "%",
      takenAt: "2026-10-01T09:00:00Z",
      facilityId: "lab-alpha",
      sourceMessageId: "fhir_obs-123",
      clinicId: null,
    });
  });

  test("uses a stable id when the resource has none", () => {
    const first = fromFhirObservation({ ...observation, id: undefined });
    const second = fromFhirObservation({ ...observation, id: undefined });
    expect(first.sourceMessageId).toBe(second.sourceMessageId);
    expect(first.sourceMessageId.startsWith("fhir_")).toBe(true);
  });

  test("rejects an observation without a patient", () => {
    expect(() =>
      fromFhirObservation({ ...observation, subject: undefined }),
    ).toThrow("subject.reference");
  });
});

const hl7 = [
  "MSH|^~\\&|LAB|lab-alpha|HERMES|hermes|20261001090000||ORU^R01|MSG0001|P|2.5",
  "PID|1||patient-2-clinic-1||Doe^Jane",
  "OBR|1|||4548-4^HbA1c",
  "OBX|1|NM|4548-4^HbA1c||9.4|%|||||||F||20261001090000",
  "OBX|2|NM|2823-3^Potassium||5.8|mmol/L|||||||F||20261001090000",
].join("\r");

describe("HL7 ORU ingestion", () => {
  test("parses one lab per numeric OBX", () => {
    const labs = parseHl7Oru(hl7);
    expect(labs).toHaveLength(2);
    expect(labs[0]).toMatchObject({
      patientId: "patient-2-clinic-1",
      markerCode: "4548-4",
      markerValue: 9.4,
      unit: "%",
      facilityId: "lab-alpha",
      sourceMessageId: "hl7_MSG0001_0",
    });
    expect(labs[1]).toMatchObject({ markerCode: "2823-3", markerValue: 5.8 });
  });

  test("rejects a message without OBX results", () => {
    const empty = hl7.split("\r").filter((line) => !line.startsWith("OBX"));
    expect(() => parseHl7Oru(empty.join("\r"))).toThrow("numeric OBX");
  });

  test("parses HL7 timestamps and falls back for junk", () => {
    const fallback = new Date("2026-01-01T00:00:00Z");
    expect(parseHl7DateTime("20261001090000", fallback)).toBe(
      "2026-10-01T09:00:00.000Z",
    );
    expect(parseHl7DateTime("", fallback)).toBe(fallback.toISOString());
  });
});
