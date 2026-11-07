"use client";

import { Card, Table as MantineTable, ScrollArea, Stack } from "@mantine/core";
import type { ColumnDef, SortingState } from "@tanstack/react-table";
import {
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import type { ReactNode } from "react";
import { useState } from "react";
import { DataTableHead } from "@/features/shared/components/table/data-table-head";
import {
  DataTableEmptyRow,
  DataTablePagination,
} from "@/features/shared/components/table/data-table-parts";
import { DataTableRow } from "@/features/shared/components/table/data-table-row";
import { DataTableSkeleton } from "@/features/shared/components/table/data-toolbar";

const PAGE_SIZE_OPTIONS = [10, 20, 30, 40, 50];

const _TableTr = MantineTable.Tr;
const _TableTd = MantineTable.Td;

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
          <MantineTable
            className="hermes-table"
            highlightOnHover
            stickyHeader
            withTableBorder
            withColumnBorders
            miw={minWidth}
          >
            <DataTableHead headerGroups={table.getHeaderGroups()} />
            <MantineTable.Tbody>
              {pageRows.length > 0 ? (
                pageRows.map((row) => (
                  <DataTableRow
                    key={row.id}
                    row={row}
                    onRowClick={onRowClick}
                    rowClassName={rowClassName}
                  />
                ))
              ) : (
                <DataTableEmptyRow
                  colSpan={columns.length}
                  emptyMessage={emptyMessage}
                  onClearFilters={onClearFilters}
                />
              )}
            </MantineTable.Tbody>
          </MantineTable>
        </ScrollArea>
      </Card>

      <DataTablePagination
        start={start}
        end={end}
        totalRecords={totalRecords}
        pageSize={pageSize}
        totalPages={totalPages}
        page={page}
        pageSizeOptions={PAGE_SIZE_OPTIONS}
        onPageChange={setPage}
        onPageSizeChange={(size) => {
          setPageSize(size);
          setPage(1);
        }}
      />
    </Stack>
  );
};
