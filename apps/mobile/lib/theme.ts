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
    background: "#f7f7f5",
    foreground: "#111315",
    card: "#ffffff",
    cardForeground: "#111315",
    primary: "#ff4500",
    primaryForeground: "#111315",
    border: "#e4e4e0",
    mutedForeground: "#565c63",
    destructive: "#991b1b",
    success: "#166534",
    warning: "#92400e",
    info: "#075985",
  },
  dark: {
    background: "#0d0e10",
    foreground: "#f5f5f4",
    card: "#16181b",
    cardForeground: "#f5f5f4",
    primary: "#ff5a1f",
    primaryForeground: "#0d0e10",
    border: "#292d33",
    mutedForeground: "#a1a7ae",
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
