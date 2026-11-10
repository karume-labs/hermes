import { SEMANTIC } from "@hermes/tokens";
import {
  DarkTheme,
  DefaultTheme,
  type Theme,
} from "expo-router/react-navigation";

/**
 * Runtime theme for React Navigation and any native surface that needs a hex
 * rather than a Tailwind class. Values come from `@hermes/tokens`, the same
 * source the CSS in `global.css` is checked against.
 */
export const THEME = {
  light: {
    background: SEMANTIC.light.canvas,
    foreground: SEMANTIC.light.textPrimary,
    card: SEMANTIC.light.surface,
    cardForeground: SEMANTIC.light.textPrimary,
    primary: SEMANTIC.light.accent,
    primaryForeground: SEMANTIC.light.accentForeground,
    border: SEMANTIC.light.border,
    mutedForeground: SEMANTIC.light.textMuted,
    destructive: SEMANTIC.light.danger,
    success: SEMANTIC.light.success,
    warning: SEMANTIC.light.warning,
    info: SEMANTIC.light.info,
  },
  dark: {
    background: SEMANTIC.dark.canvas,
    foreground: SEMANTIC.dark.textPrimary,
    card: SEMANTIC.dark.surface,
    cardForeground: SEMANTIC.dark.textPrimary,
    primary: SEMANTIC.dark.accent,
    primaryForeground: SEMANTIC.dark.accentForeground,
    border: SEMANTIC.dark.border,
    mutedForeground: SEMANTIC.dark.textMuted,
    destructive: SEMANTIC.dark.danger,
    success: SEMANTIC.dark.success,
    warning: SEMANTIC.dark.warning,
    info: SEMANTIC.dark.info,
  },
} as const;

/** Native `TextInput` props need a hex, not a CSS variable. */
export const placeholderColor = (
  scheme: "light" | "dark" | null | undefined,
): string =>
  scheme === "dark" ? SEMANTIC.dark.textMuted : SEMANTIC.light.textMuted;

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
