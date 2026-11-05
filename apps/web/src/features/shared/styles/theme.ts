import {
  Badge,
  Button,
  Card,
  createTheme,
  type MantineColorsTuple,
} from "@mantine/core";

/* Ink — Rich Slate. Text, tiles, headers. */
const ink: MantineColorsTuple = [
  "#f8fafc",
  "#f1f5f9",
  "#e2e8f0",
  "#cbd5e1",
  "#94a3b8",
  "#64748b",
  "#475569",
  "#334155",
  "#1e293b",
  "#0f172a",
];

/* Wing — Sky Blue. Fills and graphics only, never text on light. */
const wing: MantineColorsTuple = [
  "#eff9ff",
  "#dff3ff",
  "#bfeaff",
  "#9fdfff",
  "#7ed4ff",
  "#5ac7fb",
  "#38bdf8",
  "#0ea5e9",
  "#0b83b4",
  "#075985",
];

/* Spark — Electric Orange. Primary actions, focus, particles. */
const spark: MantineColorsTuple = [
  "#fff1ec",
  "#ffe0d6",
  "#ffc2ad",
  "#ff9d7a",
  "#ff7a4d",
  "#ff5d26",
  "#ff4500",
  "#e63e00",
  "#cc3700",
  "#b33000",
];

/* Status pairs. Deliberately separate from spark so urgent never reads as a
 * primary button. Shade 0 is the fill, shade 6 the text. */
const routine: MantineColorsTuple = [
  "#dcfce7",
  "#c9f7d8",
  "#a7efc0",
  "#7ee3a3",
  "#4fd183",
  "#22b463",
  "#166534",
  "#14532d",
  "#0f4425",
  "#0a351d",
];

const actionable: MantineColorsTuple = [
  "#fef3c7",
  "#fde9a8",
  "#fbd97a",
  "#f6c24a",
  "#eda92a",
  "#d18b13",
  "#92400e",
  "#7c360c",
  "#682d0a",
  "#542408",
];

const urgent: MantineColorsTuple = [
  "#fee2e2",
  "#fccfcf",
  "#f8adad",
  "#f18484",
  "#e85f5f",
  "#d93b3b",
  "#991b1b",
  "#841717",
  "#701313",
  "#5c1010",
];

const info: MantineColorsTuple = [
  "#e0f2fe",
  "#c8e8fd",
  "#9bd6fa",
  "#6cc3f4",
  "#42afec",
  "#2196d8",
  "#075985",
  "#064c72",
  "#053f5f",
  "#04324c",
];

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
