import {
  CLINICIANS,
  CLOSURE_PLANS,
  COORDINATORS,
  FOLLOW_UP,
  MARKERS,
} from "./markers";
import { createRandom, pick, severityFor, statusFor } from "./random";
import type {
  GeneratedAudit,
  GeneratedCase,
  GenerationResult,
  SeedPatient,
} from "./types";

/**
 * Expands the hand-written fixtures into a working history: eight weeks of
 * results across the seeded patients, with timestamps, acknowledgements and
 * closures that agree with each other so the board, metrics and audit trail
 * read like a clinic that has been running for a while.
 */
export const generateCaseHistory = ({
  patients,
  count = 54,
  seed = 20_260_915,
  windowHours = 56 * 24,
}: {
  patients: SeedPatient[];
  count?: number;
  seed?: number;
  windowHours?: number;
}): GenerationResult => {
  if (patients.length === 0) return { cases: [], audit: [] };

  const random = createRandom(seed);
  const cases: GeneratedCase[] = [];
  const audit: GeneratedAudit[] = [];

  for (let index = 0; index < count; index += 1) {
    const patient = patients[(index * 7 + 3) % patients.length];
    const marker = MARKERS[index % MARKERS.length];
    const severity = severityFor(random);
    const values =
      severity === "Urgent"
        ? marker.severeValues
        : severity === "Actionable"
          ? marker.moderateValues
          : marker.mildValues;
    const value = pick(values, random);

    const hoursAgo = Math.min(
      Math.round((windowHours / count) * index + random() * 9) + 1,
      windowHours,
    );
    const ackDelay = 0.2 + random() * 3.5;
    // Anything older than three days has been dealt with; leaving stale rows
    // open makes the board read like nobody works it.
    const closed = hoursAgo > 72 || (hoursAgo > 36 && random() < 0.82);
    const status = statusFor(hoursAgo, severity, closed, random);
    const acknowledgedHoursAgo =
      status === "received" || status === "triaged" || status === "notified"
        ? null
        : Math.max(Number((hoursAgo - ackDelay).toFixed(2)), 0.1);
    const slug = `hist-${String(index + 1).padStart(3, "0")}`;
    const settledAt = hoursAgo - (acknowledgedHoursAgo ?? ackDelay);

    cases.push({
      slug,
      patientId: patient.id,
      clinicId: patient.clinicId,
      severity,
      status,
      createdHoursAgo: hoursAgo,
      acknowledgedHoursAgo,
      escalatedHoursAgo:
        status === "escalated"
          ? Number(Math.max(settledAt - 1, 0.05).toFixed(2))
          : undefined,
      closedHoursAgo: closed
        ? Number(Math.max(settledAt - 2, 0.1).toFixed(2))
        : undefined,
      referralClinicId:
        status === "referred" && patient.clinicId !== "specialty-1"
          ? "specialty-1"
          : undefined,
      closurePlan: closed ? pick(CLOSURE_PLANS, random) : undefined,
      closureEvidence: closed ? `seed-${slug}-closure` : undefined,
      closedBy: closed ? pick(CLINICIANS, random) : undefined,
      summary: `Your recent screening showed ${marker.name} at ${value} ${marker.unit}. This ${FOLLOW_UP[severity]}. This is a screening flag, not a diagnosis.`,
    });

    audit.push({
      slug,
      hoursAfterCase: 0.05,
      actor: "system",
      action: "case.created",
      detail: { source: "seed", severity },
    });
    audit.push({
      slug,
      hoursAfterCase: 0.1,
      actor: "system",
      action: "case.triaged",
      detail: { severity },
    });

    if (acknowledgedHoursAgo !== null) {
      audit.push({
        slug,
        hoursAfterCase: Math.max(hoursAgo - acknowledgedHoursAgo, 0.15),
        actor: pick(COORDINATORS, random),
        action: "case.acknowledged",
        detail: { channel: random() < 0.7 ? "push" : "sms" },
      });
    }

    if (status === "escalated" || closed) {
      audit.push({
        slug,
        hoursAfterCase: Math.max(settledAt, 0.2),
        actor: pick(status === "escalated" ? CLINICIANS : COORDINATORS, random),
        action: status === "escalated" ? "case.escalated" : "case.closed",
        detail: { severity },
      });
    }
  }

  return { cases, audit };
};
