import * as SecureStore from "expo-secure-store";
import { Uniwind } from "uniwind";

export type ThemePreference = "system" | "light" | "dark";

const THEME_KEY = "hermes-theme-preference";

const isPreference = (value: string | null): value is ThemePreference =>
  value === "system" || value === "light" || value === "dark";

export const getThemePreference = async (): Promise<ThemePreference> => {
  const stored = await SecureStore.getItemAsync(THEME_KEY);
  return isPreference(stored) ? stored : "system";
};

export const applyThemePreference = (preference: ThemePreference): void => {
  Uniwind.setTheme(preference);
};

export const setThemePreference = async (
  preference: ThemePreference,
): Promise<void> => {
  await SecureStore.setItemAsync(THEME_KEY, preference);
  applyThemePreference(preference);
};
