"use client";

import type { CaseListItem } from "@hermes/types";
import { Box, Button, Group, Menu, MenuItem, Paper, Text } from "@mantine/core";
import { IconArrowRight, IconDots, IconUserPlus } from "@tabler/icons-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { SeverityBadge } from "@/features/cases/components/case-severity-badge";
import { AckState, SlaBadge } from "@/features/cases/components/case-sla-badge";
import { StatusBadge } from "@/features/cases/components/case-status-badge";

interface QueueRowProps {
  item: CaseListItem;
  canOwn: boolean;
  escalating: boolean;
  onEscalate: (caseId: string) => void;
  onAssign: (caseId: string) => void;
}

export const QueueRow = ({
  item,
  canOwn,
  escalating,
  onEscalate,
  onAssign,
}: QueueRowProps): ReactNode => (
  <Paper
    p="md"
    radius="lg"
    bg="var(--hermes-surface)"
    bd="1px solid var(--hermes-line)"
    className={
      item.status === "escalated" ? "hermes-queue-row-escalated" : undefined
    }
  >
    <Group justify="space-between" align="flex-start" wrap="nowrap" gap="md">
      <Box style={{ minWidth: 0, flex: 1 }}>
        <Group gap="xs" wrap="nowrap">
          <SeverityBadge severity={item.severity} />
          <Text fw={700} truncate>
            {item.patientName}
          </Text>
        </Group>
        <Text size="sm" c="dimmed" mt={4} lineClamp={2}>
          {item.summaryPlainLanguage}
        </Text>
        <Text size="xs" c="dimmed" mt={6} ff="monospace">
          {item.id.slice(0, 8).toUpperCase()} · {item.patientPhone}
        </Text>
      </Box>

      <Group gap="sm" wrap="nowrap" align="center">
        <Box visibleFrom="lg">
          <StatusBadge status={item.status} />
        </Box>
        <Box visibleFrom="md">
          <AckState acknowledgedAt={item.acknowledgedAt} />
        </Box>
        <SlaBadge
          slaDueAt={item.slaDueAt}
          status={item.status}
          severity={item.severity}
        />
        <Button
          component={Link}
          href={`/cases/${item.id}`}
          size="xs"
          variant="light"
          rightSection={<IconArrowRight size={14} />}
        >
          Open
        </Button>
        <Menu shadow="md" position="bottom-end" withinPortal width={210}>
          <Menu.Target>
            <Button
              size="xs"
              variant="subtle"
              color="ink"
              px={6}
              aria-label={`More actions for ${item.patientName}`}
            >
              <IconDots size={16} />
            </Button>
          </Menu.Target>
          <Menu.Dropdown>
            {canOwn ? (
              <MenuItem
                leftSection={<IconUserPlus size={15} />}
                onClick={() => onAssign(item.id)}
                disabled={item.status === "closed"}
              >
                Assign to me
              </MenuItem>
            ) : null}
            <MenuItem
              leftSection={<IconArrowRight size={15} />}
              onClick={() => onEscalate(item.id)}
              disabled={item.status === "closed" || escalating}
            >
              {escalating ? "Escalating…" : "Escalate now"}
            </MenuItem>
          </Menu.Dropdown>
        </Menu>
      </Group>
    </Group>
  </Paper>
);
