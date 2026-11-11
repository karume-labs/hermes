import { describe, expect, test } from "bun:test";
import { SEMANTIC } from "../src/semantic";
import { cssVar, read, variables } from "./helpers/css";

describe("APP_CSS_DRIFT", () => {
  test("dashboard CSS variables match the shared semantic tokens", () => {
    const css = read("apps/web/src/app/globals.css");
    const light = variables(css, ":root");
    const dark = variables(css, '[data-mantine-color-scheme="dark"]');

    expect(cssVar(light, "--hermes-canvas")).toBe(SEMANTIC.light.canvas);
    expect(cssVar(light, "--hermes-surface")).toBe(SEMANTIC.light.surface);
    expect(cssVar(light, "--hermes-surface-tint")).toBe(
      SEMANTIC.light.surfaceRaised,
    );
    expect(cssVar(light, "--hermes-ink")).toBe(SEMANTIC.light.textPrimary);
    expect(cssVar(light, "--hermes-ink-soft")).toBe(
      SEMANTIC.light.textSecondary,
    );
    expect(cssVar(light, "--hermes-ink-muted")).toBe(SEMANTIC.light.textMuted);
    expect(cssVar(light, "--hermes-line")).toBe(SEMANTIC.light.border);
    expect(cssVar(light, "--hermes-line-strong")).toBe(
      SEMANTIC.light.borderStrong,
    );
    expect(cssVar(light, "--hermes-accent")).toBe(SEMANTIC.light.accent);
    expect(cssVar(light, "--hermes-accent-hover")).toBe(
      SEMANTIC.light.accentHover,
    );
    expect(cssVar(light, "--hermes-on-accent")).toBe(
      SEMANTIC.light.accentForeground,
    );
    expect(cssVar(light, "--hermes-link")).toBe(SEMANTIC.light.link);
    expect(cssVar(light, "--hermes-brand-surface")).toBe(
      SEMANTIC.light.brandSurface,
    );
    expect(cssVar(light, "--hermes-on-brand")).toBe(SEMANTIC.light.inverse);

    expect(cssVar(dark, "--hermes-canvas")).toBe(SEMANTIC.dark.canvas);
    expect(cssVar(dark, "--hermes-surface")).toBe(SEMANTIC.dark.surface);
    expect(cssVar(dark, "--hermes-surface-tint")).toBe(
      SEMANTIC.dark.surfaceRaised,
    );
    expect(cssVar(dark, "--hermes-ink")).toBe(SEMANTIC.dark.textPrimary);
    expect(cssVar(dark, "--hermes-ink-soft")).toBe(SEMANTIC.dark.textSecondary);
    expect(cssVar(dark, "--hermes-ink-muted")).toBe(SEMANTIC.dark.textMuted);
    expect(cssVar(dark, "--hermes-brand-surface")).toBe(
      SEMANTIC.dark.brandSurface,
    );
    expect(cssVar(dark, "--hermes-line")).toBe(SEMANTIC.dark.border);
    expect(cssVar(dark, "--hermes-line-strong")).toBe(
      SEMANTIC.dark.borderStrong,
    );
    expect(cssVar(dark, "--hermes-link")).toBe(SEMANTIC.dark.link);
  });

  test("marketing CSS variables match the shared semantic tokens", () => {
    const css = read("apps/www/src/styles/global.css");
    const light = variables(css, ":root");
    const dark = variables(css, ':root[data-theme="dark"]');

    expect(cssVar(light, "--hermes-link")).toBe(SEMANTIC.light.link);
    expect(cssVar(light, "--hermes-brand-surface")).toBe(
      SEMANTIC.light.brandSurface,
    );
    expect(cssVar(dark, "--hermes-link")).toBe(SEMANTIC.dark.link);
    expect(cssVar(dark, "--hermes-brand-surface")).toBe(
      SEMANTIC.dark.brandSurface,
    );
    const theme = variables(css, "@theme");
    expect(cssVar(theme, "--color-accent")).toBe(SEMANTIC.light.accent);
    expect(cssVar(theme, "--color-on-accent")).toBe(
      SEMANTIC.light.accentForeground,
    );

    expect(cssVar(light, "--hermes-canvas")).toBe(SEMANTIC.light.canvas);
    expect(cssVar(light, "--hermes-surface")).toBe(SEMANTIC.light.surface);
    expect(cssVar(light, "--hermes-ink")).toBe(SEMANTIC.light.textPrimary);
    expect(cssVar(light, "--hermes-ink-muted")).toBe(SEMANTIC.light.textMuted);
    expect(cssVar(dark, "--hermes-canvas")).toBe(SEMANTIC.dark.canvas);
    expect(cssVar(dark, "--hermes-surface")).toBe(SEMANTIC.dark.surface);
    expect(cssVar(dark, "--hermes-ink")).toBe(SEMANTIC.dark.textPrimary);
    expect(cssVar(dark, "--hermes-ink-muted")).toBe(SEMANTIC.dark.textMuted);
  });

  test("patient app CSS variables match the shared semantic tokens", () => {
    const css = read("apps/mobile/global.css");
    const light = variables(css, "@variant light");
    const dark = variables(css, "@variant dark");

    expect(cssVar(light, "--color-background")).toBe(SEMANTIC.light.canvas);
    expect(cssVar(light, "--color-card")).toBe(SEMANTIC.light.surface);
    expect(cssVar(light, "--color-foreground")).toBe(
      SEMANTIC.light.textPrimary,
    );
    expect(cssVar(light, "--color-muted-foreground")).toBe(
      SEMANTIC.light.textMuted,
    );
    expect(cssVar(light, "--color-border")).toBe(SEMANTIC.light.border);
    expect(cssVar(light, "--color-input")).toBe(SEMANTIC.light.borderStrong);
    expect(cssVar(light, "--color-primary")).toBe(SEMANTIC.light.accent);
    expect(cssVar(light, "--color-primary-foreground")).toBe(
      SEMANTIC.light.accentForeground,
    );
    expect(cssVar(light, "--color-ring")).toBe(SEMANTIC.light.focus);

    expect(cssVar(dark, "--color-background")).toBe(SEMANTIC.dark.canvas);
    expect(cssVar(dark, "--color-card")).toBe(SEMANTIC.dark.surface);
    expect(cssVar(dark, "--color-foreground")).toBe(SEMANTIC.dark.textPrimary);
    expect(cssVar(dark, "--color-muted-foreground")).toBe(
      SEMANTIC.dark.textMuted,
    );
    expect(cssVar(dark, "--color-border")).toBe(SEMANTIC.dark.border);
    expect(cssVar(dark, "--color-input")).toBe(SEMANTIC.dark.borderStrong);
    expect(cssVar(dark, "--color-primary")).toBe(SEMANTIC.dark.accent);
    expect(cssVar(dark, "--color-primary-foreground")).toBe(
      SEMANTIC.dark.accentForeground,
    );
  });
});
