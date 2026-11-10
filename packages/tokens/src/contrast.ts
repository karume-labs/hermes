/**
 * WCAG 2.1 relative-luminance contrast, no dependency and no rounding until
 * the ratio is printed. Used by the token tests and the drift check.
 */
const channels = (hex: string): [number, number, number] => {
  const value = hex.replace("#", "");
  const full =
    value.length === 3
      ? value
          .split("")
          .map((char) => char + char)
          .join("")
      : value;
  return [
    Number.parseInt(full.slice(0, 2), 16),
    Number.parseInt(full.slice(2, 4), 16),
    Number.parseInt(full.slice(4, 6), 16),
  ];
};

const linear = (channel: number): number => {
  const value = channel / 255;
  return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
};

export const luminance = (hex: string): number => {
  const [red, green, blue] = channels(hex).map(linear);
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
};

export const contrastRatio = (
  foreground: string,
  background: string,
): number => {
  const [light, dark] = [luminance(foreground), luminance(background)].sort(
    (first, second) => second - first,
  );
  return (light + 0.05) / (dark + 0.05);
};

/** 4.5:1 for body copy, 3:1 for large text and non-text UI. */
export const meetsAa = (
  foreground: string,
  background: string,
  size: "body" | "large" | "ui" = "body",
): boolean => {
  const minimum = size === "body" ? 4.5 : 3;
  return contrastRatio(foreground, background) >= minimum;
};
