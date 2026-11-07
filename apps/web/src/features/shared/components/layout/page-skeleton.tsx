"use client";

import { Card, Group, SimpleGrid, Skeleton, Stack } from "@mantine/core";
import type { ReactNode } from "react";

const METRIC_IDS = ["metric-0", "metric-1", "metric-2", "metric-3"];
const FIELD_IDS = ["field-0", "field-1"];

/** Header: eyebrow, title, one line of subtitle, and the primary action. */
const HeaderSkeleton = (): ReactNode => (
  <Group justify="space-between" align="flex-start" wrap="wrap" gap="md">
    <Stack gap={8}>
      <Skeleton height={10} width={90} radius="xl" />
      <Skeleton height={30} width={280} radius="sm" />
      <Skeleton height={14} width={420} radius="xl" />
    </Stack>
    <Skeleton height={36} width={150} radius="md" />
  </Group>
);

const ToolbarSkeleton = (): ReactNode => (
  <Card withBorder p="lg" radius="lg" bg="var(--hermes-surface)">
    <Stack gap="md">
      <Group justify="space-between">
        <Stack gap={6}>
          <Skeleton height={14} width={80} radius="xl" />
          <Skeleton height={10} width={160} radius="xl" />
        </Stack>
        <Skeleton height={32} width={120} radius="md" />
      </Group>
      <Skeleton height={1} />
      <Skeleton height={36} radius="md" />
      <SimpleGrid cols={{ base: 1, lg: 2 }} spacing="md">
        {FIELD_IDS.map((fieldId) => (
          <Skeleton key={fieldId} height={36} radius="md" />
        ))}
      </SimpleGrid>
    </Stack>
  </Card>
);

/**
 * Route-level fallback. It repeats the real page structure — header, metrics,
 * toolbar, table — so a refresh keeps the layout instead of replacing it with a
 * lone spinner. Pass `metrics={false}` on pages that have no metric row.
 */
export const PageSkeleton = ({
  metrics = true,
  columnCount = 6,
  rows = 6,
}: {
  metrics?: boolean;
  columnCount?: number;
  rows?: number;
}): ReactNode => (
  <Stack gap="xl">
    <HeaderSkeleton />
    {metrics ? (
      <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }}>
        {METRIC_IDS.map((metricId) => (
          <Card
            key={metricId}
            withBorder
            p="lg"
            radius="lg"
            bg="var(--hermes-surface)"
          >
            <Stack gap={10}>
              <Skeleton height={10} width="50%" radius="xl" />
              <Skeleton height={26} width="35%" radius="sm" />
              <Skeleton height={10} width="75%" radius="xl" />
            </Stack>
          </Card>
        ))}
      </SimpleGrid>
    ) : null}
    <ToolbarSkeleton />
    <Card
      p={0}
      radius="lg"
      bg="var(--hermes-surface)"
      bd="1px solid var(--hermes-line)"
    >
      <Stack gap={0}>
        <Group gap="lg" px="md" py="sm">
          {FIELD_IDS.map((fieldId) => (
            <Skeleton key={fieldId} height={10} width={90} radius="xl" />
          ))}
          <Skeleton height={10} width={70} radius="xl" />
        </Group>
        {Array.from({ length: rows }, (_, index) => `row-${index}`).map(
          (rowId) => (
            <Group key={rowId} gap="lg" px="md" py="md">
              {Array.from(
                { length: columnCount },
                (_, index) => `${rowId}-cell-${index}`,
              ).map((cellId, index) => (
                <Skeleton
                  key={cellId}
                  height={index === 1 ? 26 : 14}
                  width={index === 1 ? 180 : 110}
                  radius={index === 1 ? "sm" : "xl"}
                />
              ))}
            </Group>
          ),
        )}
      </Stack>
    </Card>
  </Stack>
);
