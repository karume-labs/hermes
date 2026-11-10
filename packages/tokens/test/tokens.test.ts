import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { contrastRatio, meetsAa } from "../src/contrast";
import { PALETTE, SEMANTIC } from "../src/semantic";

const repo = join(import.meta.dir, "../../..");
const read = (path: string): string => readFileSync(join(repo, path), "utf8");

/** Balanced-brace extraction so nested @layer blocks still parse. */
const block = (css: string, selector: string): string => {
  const start = css.indexOf(selector);
  if (start === -1) throw new Error(`Missing selector: ${selector}`);
  const open = css.indexOf("{", start);
  let depth = 0;
  for (let index = open; index < css.length; index += 1) {
    if (css[index] === "{") depth += 1;
    if (css[index] === "}") {
      depth -= 1;
      if (depth === 0) return css.slice(open + 1, index);
    }
  }
  throw new Error(`Unbalanced block: ${selector}`);
};

const variables = (css: string, selector: string): Record<string, string> =>
  Object.fromEntries(
    [...block(css, selector).matchAll(/(--[\w-]+):\s*([^;]+);/g)].map(
      (match) => [match[1], match[2].trim()],
    ),
  );

const cssVar = (variables: Record<string, string>, name: string): string => {
  const value = variables[name];
  if (value === undefined) throw new Error(`Missing variable: ${name}`);
  return value;
};

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
    expect(cssVar(dark, "--hermes-brand-surface")).toBe(
      SEMANTIC.dark.brandSurface,
    );
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

describe("WCAG_AA", () => {
  const body: Array<
    [keyof typeof SEMANTIC.light, keyof typeof SEMANTIC.light]
  > = [
    ["textPrimary", "canvas"],
    ["textPrimary", "surface"],
    ["textPrimary", "surfaceRaised"],
    ["textSecondary", "canvas"],
    ["textSecondary", "surface"],
    ["textSecondary", "surfaceRaised"],
    ["textMuted", "canvas"],
    ["textMuted", "surface"],
    ["textMuted", "surfaceRaised"],
    ["accentForeground", "accent"],
    ["accentForeground", "accentHover"],
    ["link", "canvas"],
    ["link", "surface"],
    ["link", "surfaceRaised"],
    ["inverse", "brandSurface"],
    ["inverseMuted", "brandSurface"],
    ["danger", "dangerFill"],
    ["success", "successFill"],
    ["warning", "warningFill"],
    ["info", "infoFill"],
  ];

  test("body text clears 4.5:1 in both themes", () => {
    for (const theme of ["light", "dark"] as const) {
      for (const [foreground, background] of body) {
        const ratio = contrastRatio(
          SEMANTIC[theme][foreground],
          SEMANTIC[theme][background],
        );
        expect(
          meetsAa(SEMANTIC[theme][foreground], SEMANTIC[theme][background]),
          `${theme}: ${foreground} on ${background} = ${ratio.toFixed(2)}:1`,
        ).toBe(true);
      }
    }
  });

  test("brand surface is navy in light and neutral in dark", () => {
    expect(SEMANTIC.light.brandSurface).toBe(PALETTE.navy);
    expect(SEMANTIC.dark.brandSurface).toBe(SEMANTIC.dark.surface);
    const ratio = contrastRatio(
      SEMANTIC.light.inverse,
      SEMANTIC.light.brandSurface,
    );
    expect(
      meetsAa(SEMANTIC.light.inverse, SEMANTIC.light.brandSurface),
      `inverse on navy = ${ratio.toFixed(2)}:1`,
    ).toBe(true);
  });

  test("cerulean is text-only: the light link variant clears 4.5:1", () => {
    expect(SEMANTIC.light.link).toBe(PALETTE.ceruleanDeep);
    expect(SEMANTIC.dark.link).toBe(PALETTE.cerulean);
    const raw = contrastRatio(PALETTE.cerulean, PALETTE.neutral50);
    expect(
      raw,
      "raw cerulean fails light text, hence the deep variant",
    ).toBeLessThan(3);
  });

  test("borders, focus rings and the accent clear 3:1", () => {
    for (const theme of ["light", "dark"] as const) {
      for (const background of ["canvas", "surface"] as const) {
        for (const role of ["borderStrong", "focus", "accent"] as const) {
          const ratio = contrastRatio(
            SEMANTIC[theme][role],
            SEMANTIC[theme][background],
          );
          expect(
            meetsAa(SEMANTIC[theme][role], SEMANTIC[theme][background], "ui"),
            `${theme}: ${role} on ${background} = ${ratio.toFixed(2)}:1`,
          ).toBe(true);
        }
      }
    }
  });

  test("dark mode layers surfaces instead of using pure black", () => {
    expect(SEMANTIC.dark.canvas).not.toBe("#000000");
    expect(SEMANTIC.light.textPrimary).not.toBe("#ffffff");
    const order = [
      SEMANTIC.dark.canvas,
      SEMANTIC.dark.surface,
      SEMANTIC.dark.surfaceRaised,
    ];
    expect(new Set(order).size).toBe(3);
  });
});
