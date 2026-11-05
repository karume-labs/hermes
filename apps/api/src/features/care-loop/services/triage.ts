import type { Severity } from "@hermes/types";
import dayjs from "dayjs";

// Pure triage logic stays in `.ts` so `bun test` covers it.
// dayjs keeps SLA countdowns timezone-consistent.

export const SLA_HOURS: Record<Severity, number> = {
  Routine: 168,
  Actionable: 48,
  Urgent: 4,
};

export const gradeSeverity = (
  markerCode: string,
  markerValue: number,
): Severity => {
  const code = canonicalMarker(markerCode);
  if (code.includes("glucose") && markerValue >= 200) return "Urgent";
  if (code.includes("hba1c") && markerValue >= 9) return "Urgent";
  if (code.includes("potassium") && markerValue >= 6) return "Urgent";
  if (code.includes("sodium") && markerValue < 125) return "Urgent";
  if (code.includes("troponin") && markerValue >= 0.4) return "Urgent";
  if (code.includes("ldl") && markerValue >= 190) return "Actionable";
  if (code.includes("creatinine") && markerValue >= 2) return "Actionable";
  if (code.includes("potassium") && markerValue >= 5.3) return "Actionable";
  if (code.includes("bp_sys") && markerValue >= 180) return "Urgent";
  if (markerValue >= 1000) return "Actionable";
  return "Routine";
};

export const slaDueAt = (severity: Severity, from: Date = new Date()): Date =>
  dayjs(from).add(SLA_HOURS[severity], "hour").toDate();

// Lab feeds send LOINC codes while the JSON feed sends marker names. Normalise
// both to one vocabulary so grading, routing rules and plain language agree.
const LOINC_MARKERS: Record<string, string> = {
  "4548-4": "hba1c",
  "17856-6": "hba1c",
  "59261-8": "hba1c",
  "2345-7": "glucose",
  "2339-0": "glucose",
  "2823-3": "potassium",
  "2951-2": "sodium",
  "2947-0": "sodium",
  "13457-7": "ldl",
  "2089-1": "ldl",
  "18262-6": "ldl",
  "2160-0": "creatinine",
  "10839-9": "troponin",
  "6598-7": "troponin",
  "8480-6": "bp_sys",
};

const MARKER_LABELS: Record<string, string> = {
  hba1c: "HbA1c",
  glucose: "blood glucose",
  potassium: "potassium",
  sodium: "sodium",
  ldl: "LDL cholesterol",
  creatinine: "creatinine",
  troponin: "troponin",
  bp_sys: "systolic blood pressure",
};

export const canonicalMarker = (markerCode: string): string => {
  const lower = markerCode.toLowerCase();
  const mapped = LOINC_MARKERS[lower];
  return mapped ?? lower;
};

export const markerLabel = (markerCode: string): string => {
  const canonical = canonicalMarker(markerCode);
  return MARKER_LABELS[canonical] ?? markerCode;
};

export const plainLanguageSummary = (
  markerCode: string,
  markerValue: number,
  unit: string,
  severity: Severity,
): string => {
  const base = `Your recent screening showed ${markerLabel(markerCode)} at ${markerValue} ${unit}.`;
  if (severity === "Urgent")
    return `${base} This needs prompt follow-up — please book a confirmatory visit within hours. This is a screening flag, not a diagnosis.`;
  if (severity === "Actionable")
    return `${base} This is worth checking soon — please book a follow-up within 48 hours. This is a screening flag, not a diagnosis.`;
  return `${base} This looks routine. No urgent action is needed, but keep your regular check-ups.`;
};

export const isUnacknowledgedBeyond = (
  createdAt: Date,
  hours: number,
  now: Date = new Date(),
): boolean => dayjs(now).diff(dayjs(createdAt), "hour") >= hours;
