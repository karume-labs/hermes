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
import { resolveClinic } from "@api/features/ingestion/services/routing-service";
import { queueNotification } from "@api/features/notify/services/notification-service";
import type { IngestResult, NormalizedLab } from "../types/index";

const DEFAULT_CLINIC = "clinic-1";

const sourceOf = (sourceMessageId: string): string => {
  if (sourceMessageId.startsWith("fhir_")) return "fhir";
  if (sourceMessageId.startsWith("hl7_")) return "hl7";
  return "lab";
};

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
  const summary = plainLanguageSummary(
    lab.markerCode,
    lab.markerValue,
    lab.unit,
    severity,
  );

  const careCase = await createCase({
    patientId: lab.patientId,
    clinicId,
    labPayloadId: lab.sourceMessageId,
    severity,
    status: "notified",
    slaDueAt: due,
    summaryPlainLanguage: summary,
  });

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
