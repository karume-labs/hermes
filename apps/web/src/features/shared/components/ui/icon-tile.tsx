"use client";

import { Box } from "@mantine/core";
import type { ReactNode } from "react";
import { TONE_PAINT, type UiTone } from "@/features/shared/components/ui/tone";

interface IconTileProps {
  children: ReactNode;
  tone?: UiTone;
  size?: number;
  radius?: number;
}

/** Square, filled, toned icon plate: the visual anchor of a card or heading. */
export const IconTile = ({
  children,
  tone = "neutral",
  size = 38,
  radius = 11,
}: IconTileProps): ReactNode => {
  const paint = TONE_PAINT[tone];
  return (
    <Box
      aria-hidden
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        display: "grid",
        placeItems: "center",
        backgroundColor: paint.fill,
        color: paint.text,
        flexShrink: 0,
      }}
    >
      {children}
    </Box>
  );
};
