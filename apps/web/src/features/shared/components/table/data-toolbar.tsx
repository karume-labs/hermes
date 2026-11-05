"use client";

import {
  Badge,
  Button,
  Card,
  Divider,
  Group,
  ScrollArea,
  SimpleGrid,
  Skeleton,
  Stack,
  Table,
  TableTbody,
  TableTd,
  TableTh,
  TableThead,
  TableTr,
  Text,
} from "@mantine/core";
import { IconX } from "@tabler/icons-react";
import type { ReactNode } from "react";

interface DataToolbarProps {
  children: ReactNode;
  onClear?: () => void;
  filtersActive?: boolean;
  activeFilterCount?: number;
  title?: string;
  description?: string;
  meta?: ReactNode;
}

export const DataToolbar = ({
  children,
  onClear,
  filtersActive = false,
  activeFilterCount,
  title = "Filters",
  description = "Refine the results below",
  meta,
}: DataToolbarProps): ReactNode => (
  <Card withBorder shadow="sm" p="lg" radius="sm" bg="brandChalk.0">
    <Stack gap="lg">
      <Group justify="space-between">
        <Stack gap={2}>
          <Group gap="xs">
            <Text fw={500}>{title}</Text>
            {meta}
            {filtersActive && activeFilterCount ? (
              <Badge size="xs" variant="light">
                {activeFilterCount} active
              </Badge>
            ) : null}
          </Group>
          <Text size="sm" c="dimmed">
            {description}
          </Text>
        </Stack>
        {onClear === undefined || !filtersActive ? null : (
          <Button
            variant="light"
            size="xs"
            leftSection={<IconX size={14} />}
            onClick={onClear}
          >
            Clear all
          </Button>
        )}
      </Group>

      <Divider />

      <SimpleGrid cols={{ base: 1, lg: 2 }} spacing="md">
        {children}
      </SimpleGrid>
    </Stack>
  </Card>
);

const COLUMN_IDS = ["col-0", "col-1", "col-2", "col-3", "col-4", "col-5"];
const ROW_IDS = ["row-0", "row-1", "row-2", "row-3", "row-4", "row-5"];

interface DataTableSkeletonProps {
  columnCount?: number;
  rowCount?: number;
}

export const DataTableSkeleton = ({
  columnCount = 6,
  rowCount = 6,
}: DataTableSkeletonProps): ReactNode => {
  const columns = COLUMN_IDS.slice(0, columnCount);
  const rows = ROW_IDS.slice(0, rowCount);

  return (
    <Stack gap="md">
      <Card
        radius="sm"
        p={0}
        bg="brandChalk.0"
        bd="1px solid var(--mantine-color-brandChalk-3)"
      >
        <ScrollArea type="scroll">
          <Table withTableBorder withColumnBorders>
            <TableThead>
              <TableTr>
                {columns.map((columnId, index) => (
                  <TableTh key={columnId}>
                    <Skeleton
                      height={14}
                      width={`${Math.max(40, 80 - index * 10)}%`}
                      radius="xl"
                    />
                  </TableTh>
                ))}
              </TableTr>
            </TableThead>
            <TableTbody>
              {rows.map((rowId) => (
                <TableTr key={rowId}>
                  {columns.map((columnId, index) => (
                    <TableTd key={`${rowId}-${columnId}`}>
                      <Skeleton
                        height={index === 1 ? 22 : 14}
                        width={`${Math.max(30, 80 - index * 15)}%`}
                        radius={index === 1 ? "sm" : "xl"}
                      />
                    </TableTd>
                  ))}
                </TableTr>
              ))}
            </TableTbody>
          </Table>
        </ScrollArea>
      </Card>
      <Group justify="space-between">
        <Skeleton height={16} width={200} radius="xl" />
        <Skeleton height={32} width={200} radius="sm" />
      </Group>
    </Stack>
  );
};
