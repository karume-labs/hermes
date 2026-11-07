"use client";

import { Card, Group, Progress, SimpleGrid, Stack, Text } from "@mantine/core";
import type { ReactNode } from "react";

/* One accent for every bar: the label and value carry the comparison. */
const BAR_COLOR = "brandSlate.6";

interface SeverityBarProps {
  label: string;
  hours: number;
  target: string;
}

const SeverityBar = ({ label, hours, target }: SeverityBarProps): ReactNode => (
  <Stack gap={6}>
    <Group justify="space-between">
      <Text size="sm" fw={600}>
        {label}
      </Text>
      <Text size="sm" c="dimmed">
        {hours}h · target {target}
      </Text>
    </Group>
    <Progress
      value={Math.min((hours / 72) * 100, 100)}
      color={BAR_COLOR}
      size="sm"
    />
  </Stack>
);

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
    <Card
      radius="sm"
      p="xl"
      bg="brandChalk.0"
      bd="1px solid var(--mantine-color-brandChalk-3)"
    >
      <Text size="md" fw={700} mb="lg">
        How fast patients respond, by severity
      </Text>
      <Stack gap="lg">
        <SeverityBar
          label="Routine"
          hours={ackBySeverity.Routine}
          target="< 72h"
        />
        <SeverityBar
          label="Actionable"
          hours={ackBySeverity.Actionable}
          target="< 24h"
        />
        <SeverityBar
          label="Urgent"
          hours={ackBySeverity.Urgent}
          target="< 4h"
        />
      </Stack>
    </Card>

    <Card
      radius="sm"
      p="xl"
      bg="brandChalk.0"
      bd="1px solid var(--mantine-color-brandChalk-3)"
    >
      <Text size="md" fw={700} mb="lg">
        Severity mix
      </Text>
      <Stack gap="lg">
        {(
          [
            ["Routine", mix.Routine],
            ["Actionable", mix.Actionable],
            ["Urgent", mix.Urgent],
          ] as const
        ).map(([label, value]) => (
          <Stack gap={6} key={label}>
            <Group justify="space-between">
              <Text size="sm" fw={600}>
                {label}
              </Text>
              <Text size="sm" c="dimmed">
                {value} · {total === 0 ? 0 : Math.round((value / total) * 100)}%
              </Text>
            </Group>
            <Progress
              value={total === 0 ? 0 : (value / total) * 100}
              color={BAR_COLOR}
              size="sm"
            />
          </Stack>
        ))}
      </Stack>
    </Card>
  </SimpleGrid>
);
