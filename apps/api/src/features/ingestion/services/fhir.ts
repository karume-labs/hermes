import { createHash } from "node:crypto";
import { UnprocessableError } from "@api/features/shared/errors/index";
import type { FhirObservationInput } from "@hermes/validators";
import type { NormalizedLab } from "../types/index";

const stripReference = (
  value: string | undefined,
  resource: string,
): string => {
  if (value === undefined) return "";
  return value.startsWith(`${resource}/`)
    ? value.slice(resource.length + 1)
    : value;
};

const stableId = (observation: FhirObservationInput): string => {
  const seed = JSON.stringify({
    subject: observation.subject?.reference ?? "",
    code: observation.code.coding?.[0]?.code ?? observation.code.text ?? "",
    effective: observation.effectiveDateTime ?? "",
    value: observation.valueQuantity.value,
  });
  return createHash("sha256").update(seed).digest("hex").slice(0, 24);
};

// FHIR R4 Observation -> canonical lab. `id` is the idempotency key, so a
// sender retrying the same resource never produces a second case.
export const fromFhirObservation = (
  observation: FhirObservationInput,
): NormalizedLab => {
  const patientId = stripReference(observation.subject?.reference, "Patient");
  if (patientId === "") {
    throw new UnprocessableError("Observation.subject.reference is required");
  }
  const coding = observation.code.coding?.[0];
  const markerCode = coding?.code ?? observation.code.text;
  if (markerCode === undefined || markerCode === "") {
    throw new UnprocessableError("Observation.code is required");
  }
  return {
    patientId,
    markerCode,
    markerValue: observation.valueQuantity.value,
    unit: observation.valueQuantity.unit ?? "",
    takenAt: observation.effectiveDateTime ?? new Date().toISOString(),
    facilityId:
      stripReference(observation.performer?.[0]?.reference, "Organization") ||
      "lab-unknown",
    sourceMessageId: `fhir_${observation.id ?? stableId(observation)}`,
    clinicId: observation.clinicId ?? null,
  };
};
