import { PALETTE } from "./palette";

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
