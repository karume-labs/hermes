"use client";

import {
  Button,
  Group,
  Table as MantineTable,
  Pagination,
  Select,
  Stack,
  Text,
  ThemeIcon,
} from "@mantine/core";
import { IconTableOff } from "@tabler/icons-react";
import type { ReactNode } from "react";

const TableTr = MantineTable.Tr;
const TableTd = MantineTable.Td;

export const DataTableEmptyRow = ({
  colSpan,
  emptyMessage,
  onClearFilters,
}: {
  colSpan: number;
  emptyMessage: string;
  onClearFilters?: (() => void) | undefined;
}): ReactNode => (
  <TableTr>
    <TableTd colSpan={colSpan}>
      <Stack align="center" justify="center" py="xl" gap="md">
        <ThemeIcon size={60} radius="md" variant="light">
          <IconTableOff size={32} stroke={1.5} />
        </ThemeIcon>
        <Text size="lg" fw={500}>
          {emptyMessage}
        </Text>
        <Text size="sm" c="dimmed">
          Try adjusting the filters
        </Text>
        {onClearFilters === undefined ? null : (
          <Button variant="outline" onClick={onClearFilters}>
            Clear filters
          </Button>
        )}
      </Stack>
    </TableTd>
  </TableTr>
);

export const DataTablePagination = ({
  start,
  end,
  totalRecords,
  pageSize,
  totalPages,
  page,
  pageSizeOptions,
  onPageChange,
  onPageSizeChange,
}: {
  start: number;
  end: number;
  totalRecords: number;
  pageSize: number;
  totalPages: number;
  page: number;
  pageSizeOptions: number[];
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}): ReactNode => {
  if (totalRecords === 0) return null;
  return (
    <Group justify="space-between" align="center">
      <Text size="sm" c="dimmed">
        Showing {start} to {end} of {totalRecords} records
      </Text>
      <Group gap="xl">
        <Group gap="xs">
          <Text size="sm" fw={500}>
            Rows per page
          </Text>
          <Select
            value={`${pageSize}`}
            onChange={(value) => {
              if (value !== null) onPageSizeChange(Number(value));
            }}
            data={pageSizeOptions.map(String)}
            w={80}
            size="sm"
            allowDeselect={false}
          />
        </Group>
        <Pagination
          value={page}
          onChange={onPageChange}
          total={totalPages}
          withEdges
        />
      </Group>
    </Group>
  );
};
