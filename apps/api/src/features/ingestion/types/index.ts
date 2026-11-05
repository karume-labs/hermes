// Canonical shape every feed (JSON, FHIR, HL7v2) is normalised into before
// triage. Keeping it feed-agnostic is what lets one pipeline own grading,
// routing, auditing and notification.
export interface NormalizedLab {
  patientId: string;
  markerCode: string;
  markerValue: number;
  unit: string;
  takenAt: string;
  facilityId: string;
  sourceMessageId: string;
  clinicId: string | null;
}

export interface IngestResult {
  caseId: string;
  severity: string;
  slaDueAt: string;
  summary: string;
  duplicate: boolean;
}
