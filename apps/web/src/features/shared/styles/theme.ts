import {
  Badge,
  Card,
  createTheme,
  type MantineColorsTuple,
} from "@mantine/core";

/* Rich Slate — Hermes ink. Shade 9 is the logo base (#0F172A). */
const brandSlate: MantineColorsTuple = [
  "#f5f7f9",
  "#e7ebf0",
  "#cfd7df",
  "#b2bec9",
  "#94a3b0",
  "#768696",
  "#475569",
  "#334155",
  "#1e293b",
  "#0f172a",
];

/* Sky Blue — the origami wings (#38BDF8 at shade 6). */
const brandSky: MantineColorsTuple = [
  "#eff9ff",
  "#dff3ff",
  "#bfeaff",
  "#9fdfff",
  "#7ed4ff",
  "#5ac7fb",
  "#38bdf8",
  "#0ea5e9",
  "#0b83b4",
  "#086a92",
];

/* Paper canvas — every surface in the dashboard sits on shade 1. */
const brandChalk: MantineColorsTuple = [
  "#ffffff",
  "#f8fafc",
  "#eef2f6",
  "#dfe6ee",
  "#cbd5e1",
  "#94a3b8",
  "#64748b",
  "#475569",
  "#334155",
  "#1e293b",
];

export const theme = createTheme({
  colors: {
    brandSlate,
    brandSky,
    brandChalk,
    darkAnthracite: brandSlate,
    softChalk: brandChalk,
    sky: brandSky,
  },
  primaryColor: "brandSlate",
  primaryShade: { light: 9, dark: 8 },
  defaultRadius: "sm",
  fontFamily: "'Inter Variable', 'Inter', system-ui, sans-serif",
  headings: {
    fontFamily: "'Montserrat', 'Inter', sans-serif",
    fontWeight: "800",
  },
  components: {
    Badge: Badge.extend({
      defaultProps: { color: "brandSlate", variant: "light" },
    }),
    Card: Card.extend({
      defaultProps: { radius: "sm", withBorder: true },
    }),
  },
});
