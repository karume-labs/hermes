"use client";

import { Card, Group, Skeleton, Stack, Text } from "@mantine/core";
import type { ReactNode } from "react";

interface DataToolbarProps {
  title: string;
  description?: string;
  meta?: ReactNode;
  children?: ReactNode;
}

export const DataToolbar = ({
  title,
  description,
  meta,
  children,
}: DataToolbarProps): ReactNode => (
  <Group justify="space-between" align="flex-end" wrap="wrap" gap="sm">
    <Stack gap={2}>
      <Group gap="sm">
        <Text fw={700} size="lg">
          {title}
        </Text>
        {meta}
      </Group>
      {description === undefined ? null : (
        <Text size="sm" c="dimmed">
          {description}
        </Text>
      )}
    </Stack>
    {children === undefined ? null : (
      <Group gap="xs" wrap="wrap">
        {children}
      </Group>
    )}
  </Group>
);

export const DataTableSkeleton = ({
  rows = 6,
}: {
  rows?: number;
}): ReactNode => (
  <Card withBorder p="md" radius="md">
    <Stack gap="sm">
      {Array.from({ length: rows }, (_, index) => `skeleton-${index}`).map(
        (key) => (
          <Skeleton key={key} height={32} radius="sm" />
        ),
      )}
    </Stack>
  </Card>
);
