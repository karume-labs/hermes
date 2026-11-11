import { describe, expect, test } from "bun:test";
import { contrastRatio, meetsAa } from "../src/contrast";
import { PALETTE } from "../src/palette";
import { SEMANTIC } from "../src/semantic";

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
