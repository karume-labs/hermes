"use client";

import { Group, Stack, Text, Title } from "@mantine/core";
import type { ReactNode } from "react";
import { IconTile } from "@/features/shared/components/ui/icon-tile";
import type { UiTone } from "@/features/shared/components/ui/tone";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  actions?: ReactNode;
  /** Section mark shown beside the title. */
  icon?: ReactNode;
  tone?: UiTone;
}

export const PageHeader = ({
  title,
  subtitle,
  eyebrow,
  actions,
  icon,
  tone = "neutral",
}: PageHeaderProps): ReactNode => (
  <Group justify="space-between" align="flex-start" wrap="wrap" gap="md">
    <Group gap="md" align="flex-start" wrap="nowrap">
      {icon === undefined ? null : (
        <IconTile tone={tone} size={48} radius={14}>
          {icon}
        </IconTile>
      )}
      <Stack gap={4}>
        {eyebrow === undefined ? null : (
          <Group gap={8} align="center">
            <span
              aria-hidden
              style={{
                width: 18,
                height: 3,
                borderRadius: 2,
                backgroundColor: "var(--hermes-accent)",
              }}
            />
            <Text
              size="xs"
              fw={700}
              c="var(--hermes-ink-muted)"
              tt="uppercase"
              lts="0.14em"
            >
              {eyebrow}
            </Text>
          </Group>
        )}
        <Title order={1} fw={800} c="var(--hermes-ink)" lts="-0.02em">
          {title}
        </Title>
        {subtitle === undefined ? null : (
          <Text c="dimmed" size="md" maw={720} lh={1.45}>
            {subtitle}
          </Text>
        )}
      </Stack>
    </Group>
    {actions}
  </Group>
);
