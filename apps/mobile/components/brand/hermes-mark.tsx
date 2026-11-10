import type * as React from "react";
import Svg, { Circle, G, Path, Rect } from "react-native-svg";
import { HERMES_PARTICLES } from "@/components/brand/hermes-particles";

/**
 * The four Hermes tiles, traced from the brand board: the formless core field,
 * then heart (patient app), plus (clinic dashboard) and shield (admin).
 */
export type HermesMarkVariant = "core" | "patient" | "clinic" | "admin";

const NAVY = "#003B5C";
const CERULEAN = "#4BB8E7";
const BLAZE = "#FF5500";

const WINGS = [
  "M56 48 L92 24 L74 50 Z",
  "M58 52 L78 52 L92 64 L62 60 Z",
  "M60 63 L86 68 L72 80 Z",
];

const WING_TRANSFORM = "translate(48 52) scale(0.72) translate(-48 -52)";
const MIRROR_TRANSFORM = "translate(96 0) scale(-1 1)";

const ACCENTS: Partial<Record<HermesMarkVariant, string>> = {
  patient:
    "M48 62 C41 57 40 50 44 48.5 C46 47.8 48 49 48 50.5 C48 49 50 47.8 52 48.5 C56 50 55 57 48 62 Z",
  clinic: "M45 49 h6 v5 h5 v6 h-5 v5 h-6 v-5 h-5 v-6 h5 z",
  admin:
    "M 48 40 Q 52 44, 57 42 C 57 52, 52 59, 48 64 C 44 59, 39 52, 39 42 Q 44 44, 48 40 Z",
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
      <Circle cx={48} cy={48} r={46} fill={NAVY} />
    ) : variant === "admin" ? (
      <Path
        d="M48 5 L86 26 V70 L48 91 L10 70 V26 Z"
        fill={NAVY}
        stroke={NAVY}
        strokeWidth={8}
        strokeLinejoin="round"
      />
    ) : (
      <Rect
        width={96}
        height={96}
        rx={variant === "patient" ? 26 : 20}
        fill={NAVY}
      />
    )}
    <G transform={WING_TRANSFORM} fill={CERULEAN}>
      {WINGS.map((shape) => (
        <Path key={shape} d={shape} />
      ))}
    </G>
    <G transform={WING_TRANSFORM}>
      <G transform={MIRROR_TRANSFORM} fill={CERULEAN}>
        {WINGS.map((shape) => (
          <Path key={shape} d={shape} />
        ))}
      </G>
    </G>
    {variant === "core"
      ? HERMES_PARTICLES.map((dot) => (
          <Circle
            key={`${dot.cx}-${dot.cy}`}
            cx={dot.cx}
            cy={dot.cy}
            r={dot.r}
            fill={BLAZE}
            opacity={dot.o}
          />
        ))
      : null}
    {ACCENTS[variant] === undefined ? null : (
      <Path
        d={ACCENTS[variant]}
        fill={BLAZE}
        stroke={NAVY}
        strokeWidth={3}
        strokeLinejoin="round"
      />
    )}
  </Svg>
);
