/**
 * The one palette. Every app reads these hexes through its own CSS variable
 * layer or theme object; the drift check in `test/tokens.test.ts` fails when a
 * platform copy disagrees with this file.
 *
 * Brand: Blaze Orange #FF5500 (primary), Cerulean #4BB8E7 (text/icon accent),
 * Dark Navy #003B5C (brand surfaces only). Neutral scale 50-950 carries the
 * overwhelming majority of every screen; brand colour is the accent.
 */
export const PALETTE = {
  neutral50: "#f8fafc",
  neutral100: "#f1f5f9",
  neutral200: "#e2e8f0",
  neutral300: "#cbd5e1",
  neutral400: "#94a3b8",
  neutral500: "#64748b",
  neutral600: "#475569",
  neutral700: "#334155",
  neutral800: "#1e293b",
  neutral900: "#0f172a",
  neutral925: "#141922",
  neutral950: "#0b0e14",
  neutral750: "#1d2430",
  neutral650: "#2a3343",
  white: "#ffffff",

  /* Blaze Orange: fills, focus rings, indicators. Label is always ink. */
  blaze: "#ff5500",
  blazeHover: "#ff6a1a",
  blazePressed: "#e64c00",
  onBlaze: "#111315",

  /* Cerulean: text, icons and lines only. `ceruleanDeep` is the light-mode
   * text variant derived by mixing cerulean 55% toward navy (5.0:1 on paper). */
  cerulean: "#4bb8e7",
  ceruleanDeep: "#22739b",

  /* Dark Navy: brand surfaces. Never a page, card or form background. */
  navy: "#003b5c",
  onNavy: "#ffffff",
  onNavyMuted: "#cfe3ee",

  routine: "#166534",
  routineFill: "#dcfce7",
  routineDark: "#86efac",
  routineFillDark: "#0f3a22",

  actionable: "#92400e",
  actionableFill: "#fef3c7",
  actionableDark: "#fcd34d",
  actionableFillDark: "#3b2606",

  /* Clearly red, never orange-adjacent, so error cannot read as a primary CTA. */
  urgent: "#991b1b",
  urgentFill: "#fee2e2",
  urgentDark: "#fca5a5",
  urgentFillDark: "#3f1414",

  info: "#075985",
  infoFill: "#e0f2fe",
  infoDark: "#7dd3fc",
  infoFillDark: "#062f45",
} as const;
