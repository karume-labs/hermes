"use client";

import {
  Center,
  Group,
  Pagination,
  Table,
  TableScrollContainer,
  TableTbody,
  TableTd,
  TableTh,
  TableThead,
  TableTr,
  Text,
  UnstyledButton,
} from "@mantine/core";
import {
  IconChevronDown,
  IconChevronUp,
  IconSelector,
} from "@tabler/icons-react";
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type SortingState,
  useReactTable,
} from "@tanstack/react-table";
import type { ReactNode } from "react";
import { useState } from "react";

interface DataTableProps<TData> {
  data: TData[];
  columns: ColumnDef<TData, unknown>[];
  emptyMessage: string;
  pageSize?: number;
  minWidth?: number;
  rowClassName?: (row: TData) => string | undefined;
}

export const DataTable = <TData,>({
  data,
  columns,
  emptyMessage,
  pageSize = 12,
  minWidth = 900,
  rowClassName,
}: DataTableProps<TData>): ReactNode => {
  const [sorting, setSorting] = useState<SortingState>([]);
  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize, pageIndex: 0 } },
  });

  if (data.length === 0) {
    return (
      <Center py={48}>
        <Text c="dimmed" size="sm">
          {emptyMessage}
        </Text>
      </Center>
    );
  }

  return (
    <>
      <TableScrollContainer minWidth={minWidth}>
        <Table verticalSpacing="sm" highlightOnHover>
          <TableThead>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableTr key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const sortable = header.column.getCanSort();
                  const sorted = header.column.getIsSorted();
                  return (
                    <TableTh key={header.id}>
                      {sortable ? (
                        <UnstyledButton
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          <Group gap={4} wrap="nowrap">
                            <Text size="xs" fw={700} tt="uppercase">
                              {flexRender(
                                header.column.columnDef.header,
                                header.getContext(),
                              )}
                            </Text>
                            {sorted === "asc" ? (
                              <IconChevronUp size={14} />
                            ) : sorted === "desc" ? (
                              <IconChevronDown size={14} />
                            ) : (
                              <IconSelector size={14} opacity={0.4} />
                            )}
                          </Group>
                        </UnstyledButton>
                      ) : (
                        <Text size="xs" fw={700} tt="uppercase">
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                        </Text>
                      )}
                    </TableTh>
                  );
                })}
              </TableTr>
            ))}
          </TableThead>
          <TableTbody>
            {table.getRowModel().rows.map((row) => (
              <TableTr
                key={row.id}
                className={rowClassName?.(row.original)}
                bg={
                  rowClassName?.(row.original) === undefined
                    ? undefined
                    : "red.0"
                }
              >
                {row.getVisibleCells().map((cell) => (
                  <TableTd key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableTd>
                ))}
              </TableTr>
            ))}
          </TableTbody>
        </Table>
      </TableScrollContainer>

      {table.getPageCount() > 1 ? (
        <Group justify="space-between" mt="md">
          <Text size="xs" c="dimmed">
            {table.getRowModel().rows.length} of {data.length} rows
          </Text>
          <Pagination
            size="sm"
            value={table.getState().pagination.pageIndex + 1}
            total={table.getPageCount()}
            onChange={(page) => table.setPageIndex(page - 1)}
          />
        </Group>
      ) : null}
    </>
  );
};
