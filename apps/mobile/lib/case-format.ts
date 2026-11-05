import type {
  CareCase,
  JourneyStep,
  PatientCase,
  Severity,
  Slot,
} from "@hermes/types";

export const severityLabel = (severity: Severity): string => {
  if (severity === "Urgent") return "Needs attention today";
  if (severity === "Actionable") return "Follow-up recommended";
  return "Routine";
};

export const statusLabel = (careCase: CareCase): string => {
  if (careCase.status === "closed") return "Case closed";
  if (careCase.appointmentId !== null) return "Visit booked";
  if (careCase.acknowledgedAt !== null) return "Seen — next step";
  if (careCase.status === "escalated") return "Care team following up";
  if (careCase.status === "notified") return "Update waiting for you";
  return "New result";
};

export const formatDateTime = (iso: string): string =>
  new Date(iso).toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

export const formatDate = (iso: string): string =>
  new Date(iso).toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

export const slotLabel = (slot: Slot): string =>
  `${formatDateTime(slot.startAt)} · ${
    slot.kind === "telehealth" ? "Video visit" : "In person"
  }`;

export const meaningForSeverity = (severity: Severity): string => {
  if (severity === "Urgent") {
    return "One of your screening markers is far outside the expected range. That does not confirm a diagnosis on its own, but a clinician should review it today.";
  }
  if (severity === "Actionable") {
    return "One of your screening markers is outside the expected range. A confirmatory visit is the usual next step — screening flags are not diagnoses.";
  }
  return "Your results are within the range that usually needs only routine follow-up. Keep your regular check-ups and reach out if anything changes.";
};

export const whyItMatters = (severity: Severity): string => {
  if (severity === "Urgent") {
    return "Acting today lets your care team rule out anything serious and start treatment early if it is needed.";
  }
  if (severity === "Actionable") {
    return "A timely confirmatory test helps avoid guessing: most flags turn out manageable, and early follow-up keeps small findings small.";
  }
  return "Keeping routine results on file helps your care team spot changes early at your next screening.";
};

export const journeyLabel = (step: JourneyStep): string => {
  if (step === "result_received") return "Result received";
  if (step === "appointment_booked") return "Appointment booked";
  if (step === "specialist_consultation") return "Clinician consultation";
  return "Care plan completed";
};

const slotStart = (item: PatientCase): string =>
  item.slot === null ? item.careCase.updatedAt : item.slot.startAt;

export const journeyHint = (item: PatientCase): string => {
  if (item.careCase.status === "closed") {
    return "Your clinician signed off the plan. Keep the follow-up plan and contact your clinic with new symptoms.";
  }
  if (item.appointment !== null) {
    return `Your visit is ${formatDateTime(slotStart(item))}.`;
  }
  if (item.careCase.acknowledgedAt !== null) {
    return "You have seen this result. Booking a confirmatory visit is the next step.";
  }
  return "Open your result to review the plain-language summary and choose a next step.";
};

export const isOpen = (item: PatientCase): boolean =>
  item.careCase.status !== "closed";
