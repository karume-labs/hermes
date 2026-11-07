import { defaultAssigneeId } from "@api/features/care-loop/services/assignment-service";
import {
  createCase,
  findCaseByLabPayloadId,
  logAudit,
} from "@api/features/care-loop/services/case-repository";
import {
  gradeSeverity,
  plainLanguageSummary,
  slaDueAt,
} from "@api/features/care-loop/services/triage";
import {
  findClinic,
  findPatient,
} from "@api/features/directory/services/directory-service";
import { resolveClinic } from "@api/features/ingestion/services/routing-service";
import type {
  IngestResult,
  NormalizedLab,
} from "@api/features/ingestion/types/index";
import { queueNotification } from "@api/features/notify/services/notification-service";
import { UnprocessableError } from "@api/features/shared/errors/index";
import type { CareCase } from "@hermes/types";

const DEFAULT_CLINIC = "clinic-1";

const sourceOf = (sourceMessageId: string): string => {
  if (sourceMessageId.startsWith("fhir_")) return "fhir";
  if (sourceMessageId.startsWith("hl7_")) return "hl7";
  return "lab";
};

const isUniqueViolation = (error: unknown): boolean =>
  typeof error === "object" &&
  error !== null &&
  "code" in error &&
  error.code === "23505";

// The single triage entry point. Duplicate feeds short-circuit before any
// case, audit row or notification is created.
export const ingestLab = async (lab: NormalizedLab): Promise<IngestResult> => {
  const existing = await findCaseByLabPayloadId(lab.sourceMessageId);
  if (existing !== null) {
    return {
      caseId: existing.id,
      severity: existing.severity,
      slaDueAt: existing.slaDueAt,
      summary: existing.summaryPlainLanguage,
      duplicate: true,
    };
  }

  const severity = gradeSeverity(lab.markerCode, lab.markerValue);
  const due = slaDueAt(severity);
  const clinicId =
    lab.clinicId ?? (await resolveClinic(lab.markerCode, DEFAULT_CLINIC));
  const [clinic, patient] = await Promise.all([
    findClinic(clinicId),
    findPatient(lab.patientId),
  ]);
  if (clinic === null) {
    throw new UnprocessableError(`Unknown clinic: ${clinicId}`);
  }
  if (patient === null) {
    throw new UnprocessableError(`Unknown patient: ${lab.patientId}`);
  }
  const summary = plainLanguageSummary(
    lab.markerCode,
    lab.markerValue,
    lab.unit,
    severity,
  );
  // Ownership is part of triage: a case never opens without a named owner.
  const assignedToId = await defaultAssigneeId(clinicId);

  let careCase: CareCase;
  try {
    careCase = await createCase({
      patientId: lab.patientId,
      clinicId,
      labPayloadId: lab.sourceMessageId,
      severity,
      status: "notified",
      slaDueAt: due,
      summaryPlainLanguage: summary,
      assignedToId,
    });
  } catch (error) {
    // Two feeds can race past the lookup above; the unique lab payload id
    // decides the winner and the loser returns the original case.
    if (isUniqueViolation(error)) {
      const raced = await findCaseByLabPayloadId(lab.sourceMessageId);
      if (raced !== null) {
        return {
          caseId: raced.id,
          severity: raced.severity,
          slaDueAt: raced.slaDueAt,
          summary: raced.summaryPlainLanguage,
          duplicate: true,
        };
      }
    }
    throw error;
  }

  await logAudit(careCase.id, `facility:${lab.facilityId}`, "lab_ingested", {
    ...lab,
    source: sourceOf(lab.sourceMessageId),
  });
  await queueNotification({
    caseId: careCase.id,
    patientId: careCase.patientId,
    channel: "push",
    kind: "case_alert",
    payload: { severity, summary, slaDueAt: due.toISOString() },
  });
  await logAudit(careCase.id, "system", "push_queued", { severity });

  return {
    caseId: careCase.id,
    severity,
    slaDueAt: careCase.slaDueAt,
    summary,
    duplicate: false,
  };
};
