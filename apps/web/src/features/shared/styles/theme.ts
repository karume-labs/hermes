import { Badge, Button, Card, createTheme } from "@mantine/core";
import {
  actionable,
  info,
  ink,
  routine,
  spark,
  urgent,
  wing,
} from "@/features/shared/styles/theme-colors";

export const theme = createTheme({
  colors: {
    ink,
    wing,
    spark,
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
    brandSky: wing,
    brandChalk: ink,
  },
  primaryColor: "spark",
  primaryShade: { light: 6, dark: 6 },
  /* Orange is mid-luminance: filled buttons take ink text, not white (3.4:1). */
  autoContrast: true,
  /* Spark (#FF4500) sits at ~0.25 luminance: below 0.3 Mantine would pick
   * white text (3.4:1). At 0.2 it picks ink (5.2:1). */
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
    Badge: Badge.extend({
      defaultProps: { radius: "xl", variant: "light", tt: "none" },
    }),
  },
});
