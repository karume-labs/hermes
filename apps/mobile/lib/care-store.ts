// Pure journey logic — keep UI thin, testable without react-native imports.
export type JourneyStep =
  | "result_received"
  | "appointment_booked"
  | "specialist_consultation"
  | "completed";

export const JOURNEY_ORDER: JourneyStep[] = [
  "result_received",
  "appointment_booked",
  "specialist_consultation",
  "completed",
];

export const nextStep = (step: JourneyStep): JourneyStep | null => {
  const i = JOURNEY_ORDER.indexOf(step);
  const next = JOURNEY_ORDER[i + 1];
  return i < 0 || next === undefined ? null : next;
};

export const stepIndex = (step: JourneyStep): number =>
  JOURNEY_ORDER.indexOf(step);
