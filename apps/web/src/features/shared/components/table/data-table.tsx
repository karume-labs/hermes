"use client";

import {
  Button,
  Card,
  Group,
  Pagination,
  ScrollArea,
  Select,
  Stack,
  Table,
  TableTbody,
  TableTd,
  TableTh,
  TableThead,
  TableTr,
  Text,
  ThemeIcon,
  Tooltip,
} from "@mantine/core";
import { IconArrowDown, IconArrowUp, IconTableOff } from "@tabler/icons-react";
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  type SortingState,
  useReactTable,
} from "@tanstack/react-table";
import type { ReactNode } from "react";
import { useState } from "react";
import { DataTableSkeleton } from "@/features/shared/components/table/data-toolbar";

const PAGE_SIZE_OPTIONS = [10, 20, 30, 40, 50];

interface DataTableProps<TData> {
  columns: ColumnDef<TData, unknown>[];
  data: TData[];
  emptyMessage?: string;
  onClearFilters?: () => void;
  onRowClick?: (row: TData) => void;
  rowClassName?: (row: TData) => string | undefined;
  loading?: boolean;
  pageSize?: number;
  minWidth?: number;
}

export const DataTable = <TData,>({
  columns,
  data,
  emptyMessage = "No results found",
  onClearFilters,
  onRowClick,
  rowClassName,
  loading = false,
  pageSize: initialPageSize = 20,
  minWidth = 900,
}: DataTableProps<TData>): ReactNode => {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);

  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  if (loading) {
    return <DataTableSkeleton columnCount={columns.length} />;
  }

  const totalRecords = data.length;
  const totalPages = Math.ceil(totalRecords / pageSize);
  const rows = table.getRowModel().rows;
  const start = totalRecords === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, totalRecords);
  const pageRows = rows.slice((page - 1) * pageSize, end);

  return (
    <Stack gap="md">
      <Card
        radius="sm"
        p={0}
        bg="brandChalk.0"
        bd="1px solid var(--mantine-color-brandChalk-3)"
      >
        <ScrollArea type="scroll" offsetScrollbars>
          <Table
            className="hermes-table"
            highlightOnHover
            stickyHeader
            withTableBorder
            withColumnBorders
            miw={minWidth}
          >
            <TableThead>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableTr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    const canSort = header.column.getCanSort();
                    const sortDirection = header.column.getIsSorted();
                    const sortTooltip =
                      sortDirection === "asc"
                        ? "Sorted ascending — click to sort descending"
                        : sortDirection === "desc"
                          ? "Sorted descending — click to clear sort"
                          : "Click to sort ascending";

                    return (
                      <TableTh
                        key={header.id}
                        c="brandSlate.6"
                        fz={11}
                        lts="0.08em"
                        tt="uppercase"
                        onClick={
                          canSort
                            ? header.column.getToggleSortingHandler()
                            : undefined
                        }
                        style={{ cursor: canSort ? "pointer" : undefined }}
                      >
                        <Group gap={4} wrap="nowrap">
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext(),
                              )}
                          {canSort ? (
                            <Tooltip label={sortTooltip} withArrow>
                              <Group gap={0} wrap="nowrap" opacity={0.5}>
                                {sortDirection === "asc" ? (
                                  <IconArrowUp size={12} stroke={2} />
                                ) : sortDirection === "desc" ? (
                                  <IconArrowDown size={12} stroke={2} />
                                ) : (
                                  <>
                                    <IconArrowUp size={10} stroke={1.5} />
                                    <IconArrowDown size={10} stroke={1.5} />
                                  </>
                                )}
                              </Group>
                            </Tooltip>
                          ) : null}
                        </Group>
                      </TableTh>
                    );
                  })}
                </TableTr>
              ))}
            </TableThead>
            <TableTbody>
              {pageRows.length > 0 ? (
                pageRows.map((row) => (
                  <TableTr
                    key={row.id}
                    className={[
                      rowClassName?.(row.original),
                      onRowClick === undefined
                        ? undefined
                        : "hermes-clickable-row",
                    ]
                      .filter((value) => value !== undefined)
                      .join(" ")}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableTd
                        key={cell.id}
                        c="brandSlate.8"
                        onClick={
                          onRowClick === undefined ||
                          cell.column.id === "actions"
                            ? undefined
                            : () => onRowClick(row.original)
                        }
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </TableTd>
                    ))}
                  </TableTr>
                ))
              ) : (
                <TableTr>
                  <TableTd colSpan={columns.length}>
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
              )}
            </TableTbody>
          </Table>
        </ScrollArea>
      </Card>

      {totalRecords === 0 ? null : (
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
                  if (value !== null) {
                    setPageSize(Number(value));
                    setPage(1);
                  }
                }}
                data={PAGE_SIZE_OPTIONS.map(String)}
                w={80}
                size="sm"
                allowDeselect={false}
              />
            </Group>
            <Pagination
              value={page}
              onChange={setPage}
              total={totalPages}
              withEdges
            />
          </Group>
        </Group>
      )}
    </Stack>
  );
};
