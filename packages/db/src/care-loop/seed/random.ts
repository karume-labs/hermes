import type { CaseStatus, Severity } from "./types";

/** Seeded LCG: the same history on every run, no dependency on Math.random. */
export const createRandom = (seed: number) => {
  let state = seed;
  return (): number => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
};

export const pick = <T>(items: readonly T[], random: () => number): T =>
  items[Math.floor(random() * items.length)];

export const severityFor = (random: () => number): Severity => {
  const roll = random();
  if (roll < 0.16) return "Urgent";
  if (roll < 0.56) return "Actionable";
  return "Routine";
};

// Fresh results are still moving through the loop; older ones are settled.
export const statusFor = (
  hoursAgo: number,
  severity: Severity,
  closed: boolean,
  random: () => number,
): CaseStatus => {
  if (closed) return "closed";
  if (hoursAgo < 1) return "received";
  if (hoursAgo < 2) return "triaged";
  if (hoursAgo < 6) return "notified";
  if (severity === "Urgent" && random() < 0.4) return "escalated";
  if (hoursAgo < 36) {
    return pick(
      ["acknowledged", "appointment_booked", "referred"] as const,
      random,
    );
  }
  return "notified";
};
