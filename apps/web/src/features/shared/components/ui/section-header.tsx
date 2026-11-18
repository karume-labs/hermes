"use client";

import { Group, Stack, Text } from "@mantine/core";
import type { ReactNode } from "react";
import { IconTile } from "@/features/shared/components/ui/icon-tile";
import type { UiTone } from "@/features/shared/components/ui/tone";

interface SectionHeaderProps {
  icon: ReactNode;
  title: string;
  hint?: string;
  tone?: UiTone;
  action?: ReactNode;
}

/** Block heading: icon, name, one line of context, optional right-hand action. */
export const SectionHeader = ({
  icon,
  title,
  hint,
  tone = "neutral",
  action,
}: SectionHeaderProps): ReactNode => (
  <Group justify="space-between" align="center" gap="md" wrap="nowrap">
    <Group gap="sm" align="center" wrap="nowrap">
      <IconTile tone={tone} size={34} radius={10}>
        {icon}
      </IconTile>
      <Stack gap={0}>
        <Text fw={800} size="md" c="var(--hermes-ink)" lh={1.25}>
          {title}
        </Text>
        {hint === undefined ? null : (
          <Text size="xs" c="var(--hermes-ink-muted)" lh={1.35}>
            {hint}
          </Text>
        )}
      </Stack>
    </Group>
    {action}
  </Group>
);
