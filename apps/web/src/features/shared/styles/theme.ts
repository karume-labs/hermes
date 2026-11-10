import { Badge, Button, Card, createTheme } from "@mantine/core";
import {
  actionable,
  blaze,
  cerulean,
  info,
  ink,
  routine,
  urgent,
} from "@/features/shared/styles/theme-colors";

export const theme = createTheme({
  colors: {
    ink,
    cerulean,
    blaze,
    routine,
    actionable,
    urgent,
    info,
    /* Map the stock Mantine names onto the fixed status pairs so existing
     * color="red" / "orange" / "teal" call sites stay on-system. */
    red: urgent,
    orange: actionable,
    yellow: actionable,
    teal: routine,
    green: routine,
    blue: info,
    cyan: info,
    violet: info,
    indigo: info,
    gray: ink,
    /* Legacy aliases kept so existing surfaces do not change meaning. */
    brandSlate: ink,
    brandChalk: ink,
    /*
     * Mantine's dark components read colors.dark directly: dark-4 for borders,
     * dark-5 for hover, dark-6 for cards and inputs, dark-7 for the page. Stock
     * values are neutral greys that do not sit on the Hermes ladder, so the ramp
     * is re-pointed at it: text first, then lines, then the layered surfaces.
     */
    dark: [
      "#f8fafc",
      "#e2e8f0",
      "#cbd5e1",
      "#94a3b8",
      "#2a3343",
      "#1d2430",
      "#141922",
      "#10151d",
      "#0b0e14",
      "#080b10",
    ],
  },
  primaryColor: "blaze",
  primaryShade: { light: 6, dark: 6 },
  /* Blaze is mid-luminance: filled buttons take ink text (5.8:1), not white. */
  autoContrast: true,
  /* Blaze (#FF5500) sits at ~0.27 luminance: at Mantine's 0.3 default it would
   * pick white text (3.2:1). At 0.2 it picks ink (5.8:1). */
  luminanceThreshold: 0.2,
  defaultRadius: "md",
  radius: {
    xs: "2px",
    sm: "4px",
    md: "6px",
    lg: "12px",
    xl: "18px",
  },
  fontFamily:
    "'Plus Jakarta Sans Variable', 'Avenir Next', system-ui, sans-serif",
  fontSizes: {
    xs: "12px",
    sm: "13px",
    md: "15px",
    lg: "17px",
    xl: "20px",
  },
  lineHeights: {
    xs: "16px",
    sm: "18px",
    md: "22px",
    lg: "26px",
    xl: "30px",
  },
  headings: {
    fontFamily:
      "'Plus Jakarta Sans Variable', 'Avenir Next', system-ui, sans-serif",
    fontWeight: "800",
    sizes: {
      h1: { fontSize: "40px", lineHeight: "46px" },
      h2: { fontSize: "28px", lineHeight: "34px" },
      h3: { fontSize: "20px", lineHeight: "26px" },
      h4: { fontSize: "17px", lineHeight: "26px" },
      h5: { fontSize: "15px", lineHeight: "22px" },
      h6: { fontSize: "13px", lineHeight: "18px" },
    },
  },
  components: {
    Button: Button.extend({
      defaultProps: { radius: "md", fw: 700 },
    }),
    Card: Card.extend({
      defaultProps: { radius: "lg", withBorder: true },
    }),
    /* Badges read as labels, not pills: 4px, one variant, ink text. */
    Badge: Badge.extend({
      defaultProps: { radius: "sm", variant: "light", tt: "none" },
    }),
  },
});
