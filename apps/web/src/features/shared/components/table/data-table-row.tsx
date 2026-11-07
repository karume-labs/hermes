"use client";

import { Table as MantineTable } from "@mantine/core";
import type { Row } from "@tanstack/react-table";
import { flexRender } from "@tanstack/react-table";
import type { ReactNode } from "react";

const TableTr = MantineTable.Tr;
const TableTd = MantineTable.Td;

export const DataTableRow = <TData,>({
  row,
  onRowClick,
  rowClassName,
}: {
  row: Row<TData>;
  onRowClick?: ((row: TData) => void) | undefined;
  rowClassName?: ((row: TData) => string | undefined) | undefined;
}): ReactNode => (
  <TableTr
    className={[
      rowClassName?.(row.original),
      onRowClick === undefined ? undefined : "hermes-clickable-row",
    ]
      .filter((value) => value !== undefined)
      .join(" ")}
  >
    {row.getVisibleCells().map((cell) => (
      <TableTd
        key={cell.id}
        c="brandSlate.8"
        onClick={
          onRowClick === undefined || cell.column.id === "actions"
            ? undefined
            : () => onRowClick(row.original)
        }
      >
        {flexRender(cell.column.columnDef.cell, cell.getContext())}
      </TableTd>
    ))}
  </TableTr>
);
