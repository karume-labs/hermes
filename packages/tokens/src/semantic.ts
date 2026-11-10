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

export type SemanticRole =
  | "canvas"
  | "surface"
  | "surfaceRaised"
  | "textPrimary"
  | "textSecondary"
  | "textMuted"
  | "border"
  | "borderStrong"
  | "accent"
  | "accentHover"
  | "accentForeground"
  | "focus"
  | "link"
  | "brandSurface"
  | "danger"
  | "dangerFill"
  | "success"
  | "successFill"
  | "warning"
  | "warningFill"
  | "info"
  | "infoFill"
  | "inverse"
  | "inverseMuted";

export type SemanticTokens = Record<SemanticRole, string>;

/**
 * Semantic roles, named once. `textMuted` is the lightest text allowed for
 * body copy; `borderStrong` is the only border permitted on a form control or
 * another component whose edge carries meaning. `link` is the only role for
 * Cerulean text: it darkens in light mode so small copy clears 4.5:1.
 */
export const SEMANTIC: Record<"light" | "dark", SemanticTokens> = {
  light: {
    canvas: PALETTE.neutral50,
    surface: PALETTE.white,
    surfaceRaised: PALETTE.neutral100,
    textPrimary: PALETTE.neutral900,
    textSecondary: PALETTE.neutral700,
    textMuted: PALETTE.neutral600,
    border: PALETTE.neutral200,
    borderStrong: PALETTE.neutral500,
    accent: PALETTE.blaze,
    accentHover: PALETTE.blazeHover,
    accentForeground: PALETTE.onBlaze,
    focus: PALETTE.blaze,
    link: PALETTE.ceruleanDeep,
    brandSurface: PALETTE.navy,
    danger: PALETTE.urgent,
    dangerFill: PALETTE.urgentFill,
    success: PALETTE.routine,
    successFill: PALETTE.routineFill,
    warning: PALETTE.actionable,
    warningFill: PALETTE.actionableFill,
    info: PALETTE.info,
    infoFill: PALETTE.infoFill,
    inverse: PALETTE.onNavy,
    inverseMuted: PALETTE.onNavyMuted,
  },
  dark: {
    canvas: PALETTE.neutral950,
    surface: PALETTE.neutral925,
    surfaceRaised: PALETTE.neutral750,
    textPrimary: PALETTE.neutral50,
    textSecondary: PALETTE.neutral300,
    textMuted: PALETTE.neutral400,
    border: PALETTE.neutral650,
    borderStrong: PALETTE.neutral500,
    accent: PALETTE.blaze,
    accentHover: PALETTE.blazeHover,
    accentForeground: PALETTE.onBlaze,
    focus: PALETTE.blaze,
    link: PALETTE.cerulean,
    /* Navy on near-black reads muddy, so brand surfaces fall back to the
     * raised neutral; navy stays for the logo tile only. */
    brandSurface: PALETTE.neutral925,
    danger: PALETTE.urgentDark,
    dangerFill: PALETTE.urgentFillDark,
    success: PALETTE.routineDark,
    successFill: PALETTE.routineFillDark,
    warning: PALETTE.actionableDark,
    warningFill: PALETTE.actionableFillDark,
    info: PALETTE.infoDark,
    infoFill: PALETTE.infoFillDark,
    inverse: PALETTE.neutral50,
    inverseMuted: PALETTE.neutral300,
  },
};
