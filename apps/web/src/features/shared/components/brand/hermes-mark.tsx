import type { ReactNode } from "react";
import { HERMES_PARTICLES } from "@/features/shared/components/brand/hermes-particles";

/**
 * The four Hermes tiles, traced from the brand board. `core` is the formless
 * mark — sky wings inside a loose particle field of spark dots. The product
 * marks are where it takes shape: heart (patient app), plus (clinic dashboard),
 * shield on a hexagon (admin).
 */
export type HermesMarkVariant = "core" | "patient" | "clinic" | "admin";

interface HermesMarkProps {
  variant?: HermesMarkVariant;
  size?: number;
  title?: string;
}

export const SPARK = "#FF4500";
export const INK = "#0F172A";
export const WING = "#38BDF8";

interface WingProps {
  transform?: string;
}

const Wing = ({ transform }: WingProps): ReactNode => (
  <g fill={WING} transform={transform}>
    <path d="M56 48 L92 24 L74 50 Z" />
    <path d="M58 52 L78 52 L92 64 L62 60 Z" />
    <path d="M60 63 L86 68 L72 80 Z" />
  </g>
);

const Wings = (): ReactNode => (
  <g transform="translate(48 52) scale(.72) translate(-48 -52)">
    <Wing />
    <Wing transform="translate(96 0) scale(-1 1)" />
  </g>
);

const PARTICLES_NODE = (
  <g fill={SPARK}>
    {HERMES_PARTICLES.map((dot) => (
      <circle
        key={`${dot.cx}-${dot.cy}`}
        cx={dot.cx}
        cy={dot.cy}
        r={dot.r}
        opacity={dot.o}
      />
    ))}
  </g>
);

const ACCENTS: Partial<Record<HermesMarkVariant, string>> = {
  patient:
    "M48 62 C41 57 40 50 44 48.5 C46 47.8 48 49 48 50.5 C48 49 50 47.8 52 48.5 C56 50 55 57 48 62 Z",
  clinic: "M45 49 h6 v5 h5 v6 h-5 v5 h-6 v-5 h-5 v-6 h5 z",
  admin:
    "M 48 40 Q 52 44, 57 42 C 57 52, 52 59, 48 64 C 44 59, 39 52, 39 42 Q 44 44, 48 40 Z",
};

const BASE: Record<HermesMarkVariant, ReactNode> = {
  core: <rect width="96" height="96" rx="20" fill={INK} />,
  patient: <rect width="96" height="96" rx="26" fill={INK} />,
  clinic: <circle cx="48" cy="48" r="46" fill={INK} />,
  admin: (
    <path
      d="M48 5 L86 26 V70 L48 91 L10 70 V26 Z"
      fill={INK}
      stroke={INK}
      strokeWidth="8"
      strokeLinejoin="round"
    />
  ),
};

export const HermesMark = ({
  variant = "clinic",
  size = 32,
  title = "Hermes",
}: HermesMarkProps): ReactNode => (
  <svg
    viewBox="0 0 96 96"
    width={size}
    height={size}
    fill="none"
    role="img"
    aria-label={title}
  >
    <title>{title}</title>
    {BASE[variant]}
    <Wings />
    {variant === "core" ? PARTICLES_NODE : null}
    {ACCENTS[variant] === undefined ? null : (
      <path
        d={ACCENTS[variant]}
        fill={SPARK}
        stroke={INK}
        strokeWidth="3"
        strokeLinejoin="round"
        paintOrder="stroke"
      />
    )}
  </svg>
);

interface HermesWordmarkProps {
  size?: number;
  color?: string;
}

export const HermesWordmark = ({
  size = 20,
  color = INK,
}: HermesWordmarkProps): ReactNode => (
  <span
    style={{
      color,
      fontSize: size,
      fontWeight: 800,
      letterSpacing: "0.14em",
      lineHeight: 1,
      textTransform: "lowercase",
    }}
  >
    hermes
  </span>
);
