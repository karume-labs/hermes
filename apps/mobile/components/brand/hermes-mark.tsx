import type * as React from "react";
import Svg, { Circle, G, Path, Rect } from "react-native-svg";

export type HermesMarkVariant = "patient" | "clinic";

const WINGS = [
  "M56 48 L92 24 L74 50 Z",
  "M58 52 L78 52 L92 64 L62 60 Z",
  "M60 63 L86 68 L72 80 Z",
];

const WING_TRANSFORM = "translate(48 52) scale(0.72) translate(-48 -52)";
const MIRROR_TRANSFORM = "translate(96 0) scale(-1 1)";

interface HermesMarkProps {
  size?: number;
  variant?: HermesMarkVariant;
}

/**
 * The logo from logo.html: a slate base, sky-blue origami wings and a
 * white heart. The orange accent was dropped — sky and slate are the brand.
 */
export const HermesMark = ({
  size = 28,
  variant = "clinic",
}: HermesMarkProps): React.ReactElement => (
  <Svg width={size} height={size} viewBox="0 0 96 96">
    {variant === "clinic" ? (
      <Circle cx={48} cy={48} r={46} fill="#0F172A" />
    ) : (
      <Rect width={96} height={96} rx={26} fill="#0F172A" />
    )}
    <G transform={WING_TRANSFORM} fill="#38BDF8">
      {WINGS.map((shape) => (
        <Path key={shape} d={shape} />
      ))}
    </G>
    <G transform={WING_TRANSFORM}>
      <G transform={MIRROR_TRANSFORM} fill="#38BDF8">
        {WINGS.map((shape) => (
          <Path key={shape} d={shape} />
        ))}
      </G>
    </G>
    <Path
      d="M48 62 C41 57 40 50 44 48.5 C46 47.8 48 49 48 50.5 C48 49 50 47.8 52 48.5 C56 50 55 57 48 62 Z"
      fill="#F8FAFC"
    />
  </Svg>
);
