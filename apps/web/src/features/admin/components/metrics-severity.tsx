"use client";

import { Card, Group, Progress, SimpleGrid, Stack, Text } from "@mantine/core";
import type { ReactNode } from "react";
import {
  SEVERITY,
  SeverityBar,
  type SeverityName,
} from "@/features/admin/components/metrics-severity-bar";
import { IconTile } from "@/features/shared/components/ui/icon-tile";

const ORDER: SeverityName[] = ["Routine", "Actionable", "Urgent"];

export interface SeveritySectionProps {
  ackBySeverity: { Routine: number; Actionable: number; Urgent: number };
  mix: { Routine: number; Actionable: number; Urgent: number };
  total: number;
}

export const SeveritySection = ({
  ackBySeverity,
  mix,
  total,
}: SeveritySectionProps): ReactNode => (
  <SimpleGrid cols={{ base: 1, lg: 2 }}>
    <Card p="xl" bg="var(--hermes-surface)" bd="1px solid var(--hermes-line)">
      <Group justify="space-between" mb="lg">
        <Text size="md" fw={800}>
          How fast patients respond
        </Text>
        <Text size="xs" c="dimmed">
          by severity
        </Text>
      </Group>
      <Stack gap="lg">
        {ORDER.map((label) => (
          <SeverityBar
            key={label}
            label={label}
            hours={ackBySeverity[label]}
            target={
              label === "Routine"
                ? "< 72h"
                : label === "Actionable"
                  ? "< 24h"
                  : "< 4h"
            }
            scale={72}
          />
        ))}
      </Stack>
    </Card>

    <Card p="xl" bg="var(--hermes-surface)" bd="1px solid var(--hermes-line)">
      <Group justify="space-between" mb="lg">
        <Text size="md" fw={800}>
          Severity mix
        </Text>
        <Text size="xs" c="dimmed">
          {total} cases
        </Text>
      </Group>
      <Stack gap="lg">
        {ORDER.map((label) => {
          const value = mix[label];
          const share = total === 0 ? 0 : Math.round((value / total) * 100);
          return (
            <Stack gap={6} key={label}>
              <Group justify="space-between" gap="sm">
                <Group gap={8} align="center">
                  <IconTile tone={SEVERITY[label].tone} size={26} radius={8}>
                    {SEVERITY[label].icon}
                  </IconTile>
                  <Text size="sm" fw={700}>
                    {label}
                  </Text>
                </Group>
                <Text size="sm" c="dimmed">
                  <Text span fw={800} c="var(--hermes-ink)">
                    {value}
                  </Text>
                  {" · "}
                  {share}%
                </Text>
              </Group>
              <Progress
                value={share}
                color={SEVERITY[label].color}
                size="md"
                radius="xl"
              />
            </Stack>
          );
        })}
      </Stack>
    </Card>
  </SimpleGrid>
);
