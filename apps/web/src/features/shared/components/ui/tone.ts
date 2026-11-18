/**
 * The four status pairs plus a neutral. Tones only ever come from the semantic
 * tokens, so a new surface cannot invent a colour the brand does not own.
 */
export type UiTone = "neutral" | "routine" | "actionable" | "urgent" | "info";

interface TonePaint {
  fill: string;
  text: string;
}

export const TONE_PAINT: Record<UiTone, TonePaint> = {
  neutral: {
    fill: "var(--hermes-surface-tint)",
    text: "var(--hermes-ink-soft)",
  },
  routine: {
    fill: "var(--hermes-routine-fill)",
    text: "var(--hermes-routine-text)",
  },
  actionable: {
    fill: "var(--hermes-actionable-fill)",
    text: "var(--hermes-actionable-text)",
  },
  urgent: {
    fill: "var(--hermes-urgent-fill)",
    text: "var(--hermes-urgent-text)",
  },
  info: { fill: "var(--hermes-info-fill)", text: "var(--hermes-info-text)" },
};
