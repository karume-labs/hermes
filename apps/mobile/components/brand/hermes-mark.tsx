import type * as React from "react";
import Svg, { Circle, G, Path, Rect } from "react-native-svg";

/**
 * The four Hermes tiles, mirroring apps/web: `core` is the formless mark with
 * orange particles, then heart (patient), plus (clinic) and shield (admin).
 */
export type HermesMarkVariant = "core" | "patient" | "clinic" | "admin";

const INK = "#0F172A";
const WING = "#38BDF8";
const SPARK = "#FF4500";
const CHALK = "#F8FAFC";

const WINGS = [
  "M56 48 L92 24 L74 50 Z",
  "M58 52 L78 52 L92 64 L62 60 Z",
  "M60 63 L86 68 L72 80 Z",
];

const WING_TRANSFORM = "translate(48 52) scale(0.72) translate(-48 -52)";
const MIRROR_TRANSFORM = "translate(96 0) scale(-1 1)";

/* Particles gather in the corners: never touching the wings, never centred. */
const PARTICLES = [
  { cx: 14, cy: 17, r: 2.6 },
  { cx: 48, cy: 11, r: 1.8 },
  { cx: 82, cy: 19, r: 2.1 },
  { cx: 17, cy: 81, r: 2.1 },
  { cx: 79, cy: 79, r: 2.6 },
];

const ACCENTS: Partial<Record<HermesMarkVariant, string>> = {
  patient:
    "M48 62 C41 57 40 50 44 48.5 C46 47.8 48 49 48 50.5 C48 49 50 47.8 52 48.5 C56 50 55 57 48 62 Z",
  clinic: "M45 49 h6 v5 h5 v6 h-5 v5 h-6 v-5 h-5 v-6 h5 z",
  admin:
    "M48 44 Q52 45 56 44 C56 53 52 59 48 63 C44 59 40 53 40 44 Q44 45 48 44 Z",
};

interface HermesMarkProps {
  size?: number;
  variant?: HermesMarkVariant;
}

export const HermesMark = ({
  size = 28,
  variant = "patient",
}: HermesMarkProps): React.ReactElement => (
  <Svg width={size} height={size} viewBox="0 0 96 96">
    {variant === "clinic" ? (
      <Circle cx={48} cy={48} r={46} fill={INK} />
    ) : variant === "admin" ? (
      <Path
        d="M48 5 L86 26 V70 L48 91 L10 70 V26 Z"
        fill={INK}
        stroke={INK}
        strokeWidth={8}
        strokeLinejoin="round"
      />
    ) : (
      <Rect
        width={96}
        height={96}
        rx={variant === "patient" ? 26 : 20}
        fill={INK}
      />
    )}
    <G transform={WING_TRANSFORM} fill={WING}>
      {WINGS.map((shape) => (
        <Path key={shape} d={shape} />
      ))}
    </G>
    <G transform={WING_TRANSFORM}>
      <G transform={MIRROR_TRANSFORM} fill={WING}>
        {WINGS.map((shape) => (
          <Path key={shape} d={shape} />
        ))}
      </G>
    </G>
    {variant === "core"
      ? PARTICLES.map((dot) => (
          <Circle key={`${dot.cx}-${dot.cy}`} {...dot} fill={SPARK} />
        ))
      : null}
    {ACCENTS[variant] === undefined ? null : (
      <Path d={ACCENTS[variant]} fill={CHALK} />
    )}
  </Svg>
);
