"use client";

import { Card, Group, Stack, Text, UnstyledButton } from "@mantine/core";
import { IconCheck } from "@tabler/icons-react";
import type { ReactNode } from "react";
import { IconTile } from "@/features/shared/components/ui/icon-tile";

interface ChannelCardProps {
  icon: ReactNode;
  title: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  onSelect: () => void;
}

/**
 * A channel is a choice, not a slider: one card per destination, spark edge and
 * a check when it is the one in use. The whole card is the control.
 */
export const ChannelCard = ({
  icon,
  title,
  description,
  checked,
  disabled = false,
  onSelect,
}: ChannelCardProps): ReactNode => (
  <UnstyledButton
    onClick={onSelect}
    disabled={disabled}
    aria-pressed={checked}
    style={{ width: "100%", height: "100%" }}
  >
    <Card
      p="lg"
      h="100%"
      bg="var(--hermes-surface)"
      bd={
        checked
          ? "1.5px solid var(--hermes-accent)"
          : "1px solid var(--hermes-line)"
      }
      style={{
        opacity: disabled ? 0.6 : 1,
        boxShadow: checked ? "var(--hermes-elev-1)" : undefined,
        transition: "border-color 160ms ease, box-shadow 160ms ease",
      }}
    >
      <Stack gap="sm">
        <Group justify="space-between" align="flex-start">
          <IconTile tone={checked ? "info" : "neutral"} size={38}>
            {icon}
          </IconTile>
          {checked ? (
            <IconCheck
              size={18}
              stroke={2.6}
              color="var(--hermes-accent)"
              aria-hidden
            />
          ) : null}
        </Group>
        <Text fw={800} size="md" c="var(--hermes-ink)">
          {title}
        </Text>
        <Text size="xs" c="var(--hermes-ink-muted)" lh={1.45}>
          {description}
        </Text>
      </Stack>
    </Card>
  </UnstyledButton>
);
