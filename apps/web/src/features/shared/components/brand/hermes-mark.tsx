import type { ReactNode } from "react";

/**
 * The four Hermes tiles. `core` is the formless mark (orange particles around
 * sky wings); the three product marks are where it takes shape — heart for the
 * patient app, plus for the clinic dashboard, shield for admin.
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
export const CHALK = "#F8FAFC";

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

/**
 * Particle rule: dots never touch the wings and never sit in the middle of the
 * tile. They gather in the corners, outside the wing span.
 */
const PARTICLES: ReadonlyArray<{ cx: number; cy: number; r: number }> = [
  { cx: 14, cy: 17, r: 2.6 },
  { cx: 48, cy: 11, r: 1.8 },
  { cx: 82, cy: 19, r: 2.1 },
  { cx: 17, cy: 81, r: 2.1 },
  { cx: 79, cy: 79, r: 2.6 },
];

const Particles = (): ReactNode => (
  <g fill={SPARK}>
    {PARTICLES.map((dot) => (
      <circle key={`${dot.cx}-${dot.cy}`} {...dot} />
    ))}
  </g>
);

const ACCENTS: Partial<Record<HermesMarkVariant, string>> = {
  patient:
    "M48 62 C41 57 40 50 44 48.5 C46 47.8 48 49 48 50.5 C48 49 50 47.8 52 48.5 C56 50 55 57 48 62 Z",
  clinic: "M45 49 h6 v5 h5 v6 h-5 v5 h-6 v-5 h-5 v-6 h5 z",
  admin:
    "M48 44 Q52 45 56 44 C56 53 52 59 48 63 C44 59 40 53 40 44 Q44 45 48 44 Z",
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
    {variant === "core" ? <Particles /> : null}
    {ACCENTS[variant] === undefined ? null : (
      <path d={ACCENTS[variant]} fill={CHALK} />
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
