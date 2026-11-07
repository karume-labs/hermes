"use client";

import { Badge } from "@mantine/core";
import type { ReactNode } from "react";

export type Tone = "routine" | "actionable" | "urgent" | "info";

/* Status pairs from the design system. Never reused for primary actions. */
const _TONE: Record<Tone, { fill: string; text: string }> = {
  routine: { fill: "#DCFCE7", text: "#166534" },
  actionable: { fill: "#FEF3C7", text: "#92400E" },
  urgent: { fill: "#FEE2E2", text: "#991B1B" },
  info: { fill: "#E0F2FE", text: "#075985" },
};

/* Status pairs from the design system. Never reused for primary actions. */
export const TONE: Record<Tone, { fill: string; text: string }> = {
  routine: { fill: "#DCFCE7", text: "#166534" },
  actionable: { fill: "#FEF3C7", text: "#92400E" },
  urgent: { fill: "#FEE2E2", text: "#991B1B" },
  info: { fill: "#E0F2FE", text: "#075985" },
};

export const Pill = ({
  tone,
  icon,
  children,
  solid = false,
}: {
  tone: Tone;
  icon?: ReactNode;
  children: ReactNode;
  solid?: boolean;
}): ReactNode => (
  <Badge
    variant="light"
    leftSection={icon}
    styles={{
      root: {
        backgroundColor: solid ? TONE[tone].text : TONE[tone].fill,
        color: solid ? "#FFFFFF" : TONE[tone].text,
        border: "none",
        textTransform: "none",
      },
    }}
  >
    {children}
  </Badge>
);
