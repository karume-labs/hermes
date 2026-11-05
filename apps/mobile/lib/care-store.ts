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

export function nextStep(step: JourneyStep): JourneyStep | null {
  const i = JOURNEY_ORDER.indexOf(step);
  return i < 0 || i === JOURNEY_ORDER.length - 1 ? null : JOURNEY_ORDER[i + 1];
}

export function stepIndex(step: JourneyStep): number {
  return JOURNEY_ORDER.indexOf(step);
}
