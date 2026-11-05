import {
  DarkTheme,
  DefaultTheme,
  type Theme,
} from "expo-router/react-navigation";

export const THEME = {
  light: {
    background: "#f6f8fb",
    foreground: "#0f172a",
    card: "#ffffff",
    cardForeground: "#0f172a",
    primary: "#0369a1",
    primaryForeground: "#f8fafc",
    border: "#dde5ee",
    mutedForeground: "#5b6b7c",
    destructive: "#b42318",
  },
  dark: {
    background: "#101725",
    foreground: "#f1f5f9",
    card: "#161f2e",
    cardForeground: "#f1f5f9",
    primary: "#38bdf8",
    primaryForeground: "#06202f",
    border: "#263141",
    mutedForeground: "#9aa9bc",
    destructive: "#f87171",
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
