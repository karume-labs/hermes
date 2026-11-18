"use client";

import { Group, Progress, Stack, Text } from "@mantine/core";
import {
  IconAlertOctagon,
  IconAlertTriangle,
  IconCircleCheck,
} from "@tabler/icons-react";
import type { ReactNode } from "react";
import { IconTile } from "@/features/shared/components/ui/icon-tile";
import type { UiTone } from "@/features/shared/components/ui/tone";

export type SeverityName = "Routine" | "Actionable" | "Urgent";

interface SeverityTone {
  tone: UiTone;
  color: string;
  icon: ReactNode;
}

export const SEVERITY: Record<SeverityName, SeverityTone> = {
  Routine: {
    tone: "routine",
    color: "var(--hermes-routine-text)",
    icon: <IconCircleCheck size={17} />,
  },
  Actionable: {
    tone: "actionable",
    color: "var(--hermes-actionable-text)",
    icon: <IconAlertTriangle size={17} />,
  },
  Urgent: {
    tone: "urgent",
    color: "var(--hermes-urgent-text)",
    icon: <IconAlertOctagon size={17} />,
  },
};

interface SeverityBarProps {
  label: SeverityName;
  hours: number;
  target: string;
  scale: number;
}

export const SeverityBar = ({
  label,
  hours,
  target,
  scale,
}: SeverityBarProps): ReactNode => (
  <Stack gap={6}>
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
          {hours}
        </Text>
        h · target {target}
      </Text>
    </Group>
    <Progress
      value={Math.min((hours / scale) * 100, 100)}
      color={SEVERITY[label].color}
      size="md"
      radius="xl"
    />
  </Stack>
);
