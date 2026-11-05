import type { ReactNode } from "react";

export type HermesMarkVariant = "patient" | "clinic" | "governance";

interface HermesMarkProps {
  variant?: HermesMarkVariant;
  size?: number;
  title?: string;
}

interface WingProps {
  transform?: string;
}

const Wing = ({ transform }: WingProps): ReactNode => (
  <g fill="#38BDF8" transform={transform}>
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

const ACCENTS: Record<HermesMarkVariant, string> = {
  patient:
    "M48 62 C41 57 40 50 44 48.5 C46 47.8 48 49 48 50.5 C48 49 50 47.8 52 48.5 C56 50 55 57 48 62 Z",
  clinic: "M45 49 h6 v5 h5 v6 h-5 v5 h-6 v-5 h-5 v-6 h5 z",
  governance:
    "M48 44 Q52 45 56 44 C56 53 52 59 48 63 C44 59 40 53 40 44 Q44 45 48 44 Z",
};

const BASE: Record<HermesMarkVariant, ReactNode> = {
  patient: <rect width="96" height="96" rx="26" fill="#0F172A" />,
  clinic: <circle cx="48" cy="48" r="46" fill="#0F172A" />,
  governance: (
    <path
      d="M48 5 L86 26 V70 L48 91 L10 70 V26 Z"
      fill="#0F172A"
      stroke="#0F172A"
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
    <path d={ACCENTS[variant]} fill="#F8FAFC" />
  </svg>
);

interface HermesWordmarkProps {
  size?: number;
  color?: string;
}

export const HermesWordmark = ({
  size = 20,
  color = "#0F172A",
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
