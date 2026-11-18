"use client";

import { Button, Card, Group, Stack, Text } from "@mantine/core";
import {
  IconBuildingHospital,
  IconClockHour4,
  IconPlayerPause,
  IconPlayerPlay,
} from "@tabler/icons-react";
import type { ReactNode } from "react";
import { IconTile } from "@/features/shared/components/ui/icon-tile";
import { Pill } from "@/features/shared/components/ui/pill";

export interface ClinicTileData {
  id: string;
  name: string;
  timezone: string;
  isActive: boolean;
}

interface ClinicTileProps {
  clinic: ClinicTileData;
  busy: boolean;
  onToggle: () => void;
}

/** One clinic as a card: mark, name, timezone, state, and the one action. */
export const ClinicTile = ({
  clinic,
  busy,
  onToggle,
}: ClinicTileProps): ReactNode => (
  <Card p="md" bg="var(--hermes-surface)" bd="1px solid var(--hermes-line)">
    <Stack gap="md" h="100%" justify="space-between">
      <Group gap="sm" wrap="nowrap" align="flex-start">
        <IconTile tone={clinic.isActive ? "routine" : "urgent"} size={34}>
          <IconBuildingHospital size={17} />
        </IconTile>
        <Stack gap={2} style={{ minWidth: 0 }}>
          <Text fw={700} size="sm" lh={1.3} lineClamp={2}>
            {clinic.name}
          </Text>
          <Group gap={5} wrap="nowrap">
            <IconClockHour4
              size={11}
              color="var(--hermes-ink-muted)"
              aria-hidden
            />
            <Text size="xs" c="var(--hermes-ink-muted)" truncate>
              {clinic.timezone}
            </Text>
          </Group>
        </Stack>
      </Group>

      <Group justify="space-between" gap="xs" wrap="nowrap">
        <Pill tone={clinic.isActive ? "routine" : "urgent"} size="sm">
          {clinic.isActive ? "Receiving results" : "Paused"}
        </Pill>
        <Button
          size="compact-xs"
          variant="subtle"
          loading={busy}
          leftSection={
            clinic.isActive ? (
              <IconPlayerPause size={13} />
            ) : (
              <IconPlayerPlay size={13} />
            )
          }
          onClick={onToggle}
        >
          {clinic.isActive ? "Pause" : "Resume"}
        </Button>
      </Group>
    </Stack>
  </Card>
);
