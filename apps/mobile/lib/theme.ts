import {
  DarkTheme,
  DefaultTheme,
  type Theme,
} from "expo-router/react-navigation";

/**
 * Hermes tokens, identical hexes to apps/web and apps/www. Spark is the only
 * primary action colour; ink carries text and tiles; status pairs stay apart
 * from spark so "urgent" never reads as a button.
 */
export const THEME = {
  light: {
    background: "#f8fafc",
    foreground: "#0f172a",
    card: "#ffffff",
    cardForeground: "#0f172a",
    primary: "#ff4500",
    primaryForeground: "#0f172a",
    border: "#e2e8f0",
    mutedForeground: "#475569",
    destructive: "#991b1b",
    success: "#166534",
    warning: "#92400e",
    info: "#075985",
  },
  dark: {
    background: "#0f172a",
    foreground: "#f8fafc",
    card: "#16233b",
    cardForeground: "#f8fafc",
    primary: "#ff4500",
    primaryForeground: "#0f172a",
    border: "#263141",
    mutedForeground: "#cbd5e1",
    destructive: "#fca5a5",
    success: "#86efac",
    warning: "#fcd34d",
    info: "#7dd3fc",
  },
} as const;

export const NAV_THEME: Record<"light" | "dark", Theme> = {
  light: {
    ...DefaultTheme,
    colors: {
      background: THEME.light.background,
      border: THEME.light.border,
      card: THEME.light.card,
      notification: THEME.light.destructive,
      primary: THEME.light.primary,
      text: THEME.light.foreground,
    },
  },
  dark: {
    ...DarkTheme,
    colors: {
      background: THEME.dark.background,
      border: THEME.dark.border,
      card: THEME.dark.card,
      notification: THEME.dark.destructive,
      primary: THEME.dark.primary,
      text: THEME.dark.foreground,
    },
  },
};
