"use client";

import {
  ActionIcon,
  Badge,
  Button,
  Card,
  Divider,
  Group,
  Paper,
  SimpleGrid,
  Stack,
  Text,
  Tooltip,
} from "@mantine/core";
import { IconArrowDown, IconArrowUp, IconX } from "@tabler/icons-react";
import type { ReactNode } from "react";

export type ToolbarSort = "newest" | "oldest";

interface DataToolbarProps {
  children: ReactNode;
  search?: ReactNode;
  onClear?: () => void;
  filtersActive?: boolean;
  activeFilterCount?: number;
  title?: string;
  description?: string;
  meta?: ReactNode;
  sort?: ToolbarSort;
  onSortChange?: (sort: ToolbarSort) => void;
}

/**
 * The single place list filters live: header with the active-count badge and
 * sort control, a full-width search slot, then the filter grid.
 */
export const DataToolbar = ({
  children,
  search,
  onClear,
  filtersActive = false,
  activeFilterCount,
  title = "Filters",
  description = "Narrow the list below",
  meta,
  sort,
  onSortChange,
}: DataToolbarProps): ReactNode => (
  <Card withBorder p="lg" radius="lg" bg="var(--hermes-surface)">
    <Stack gap="md">
      <Group justify="space-between" align="flex-start" wrap="wrap" gap="sm">
        <Stack gap={2}>
          <Group gap="xs">
            <Text fw={700}>{title}</Text>
            {meta}
            {filtersActive ? (
              <Badge variant="light" color="ink" size="xs">
                {activeFilterCount ?? 0} active
              </Badge>
            ) : null}
          </Group>
          <Text size="sm" c="dimmed">
            {description}
          </Text>
        </Stack>
        <Group gap="xs" wrap="nowrap">
          {onSortChange === undefined || sort === undefined ? null : (
            <Paper
              component={Group}
              gap={4}
              p={4}
              radius="md"
              bd="1px solid var(--hermes-line)"
            >
              <Tooltip label="Newest first" withArrow>
                <ActionIcon
                  variant={sort === "newest" ? "light" : "subtle"}
                  color="ink"
                  onClick={() => onSortChange("newest")}
                  aria-label="Sort newest first"
                >
                  <IconArrowDown size={16} />
                </ActionIcon>
              </Tooltip>
              <Tooltip label="Oldest first" withArrow>
                <ActionIcon
                  variant={sort === "oldest" ? "light" : "subtle"}
                  color="ink"
                  onClick={() => onSortChange("oldest")}
                  aria-label="Sort oldest first"
                >
                  <IconArrowUp size={16} />
                </ActionIcon>
              </Tooltip>
            </Paper>
          )}
          {onClear === undefined || !filtersActive ? null : (
            <Button
              variant="light"
              color="ink"
              size="xs"
              leftSection={<IconX size={14} />}
              onClick={onClear}
            >
              Clear all
            </Button>
          )}
        </Group>
      </Group>

      <Divider />

      {search === undefined ? null : search}

      <SimpleGrid cols={{ base: 1, lg: 2 }} spacing="md">
        {children}
      </SimpleGrid>
    </Stack>
  </Card>
);
