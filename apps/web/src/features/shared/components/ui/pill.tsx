"use client";

import type { BadgeProps } from "@mantine/core";
import { Badge, Tooltip } from "@mantine/core";
import type { ReactNode } from "react";

/**
 * One colour, four weights. Meaning rides on the variant instead of a rainbow
 * of fills: filled is the thing that needs a person now, light is waiting on
 * someone else, outline is settled, default is background context. Icons and
 * labels keep the signal when colour is not available.
 */
export type Tone = "routine" | "actionable" | "urgent" | "info";

const VARIANT: Record<Tone, BadgeProps["variant"]> = {
  urgent: "filled",
  actionable: "light",
  routine: "outline",
  info: "default",
};

interface PillProps {
  tone: Tone;
  children: ReactNode;
  icon?: ReactNode;
  description?: string;
  size?: BadgeProps["size"];
}

export const Pill = ({
  tone,
  icon,
  children,
  description,
  size,
}: PillProps): ReactNode => {
  const badge = (
    <Badge
      color="ink"
      variant={VARIANT[tone]}
      leftSection={icon}
      size={size}
      styles={{ root: { textTransform: "none" } }}
    >
      {children}
    </Badge>
  );

  if (description === undefined) return badge;

  return (
    <Tooltip label={description} withArrow openDelay={300} multiline w={240}>
      {badge}
    </Tooltip>
  );
};
