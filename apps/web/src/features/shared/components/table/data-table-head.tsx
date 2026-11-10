"use client";

import { Group, Table as MantineTable, Tooltip } from "@mantine/core";
import { IconArrowDown, IconArrowUp } from "@tabler/icons-react";
import type { HeaderGroup } from "@tanstack/react-table";
import { flexRender } from "@tanstack/react-table";
import type { ReactNode } from "react";

const TableThead = MantineTable.Thead;
const TableTr = MantineTable.Tr;
const TableTh = MantineTable.Th;

const sortTooltipFor = (direction: "asc" | "desc" | false): string => {
  if (direction === "asc") return "Sorted ascending — click to sort descending";
  if (direction === "desc") return "Sorted descending — click to clear sort";
  return "Click to sort ascending";
};

export const DataTableHead = <TData,>({
  headerGroups,
}: {
  headerGroups: HeaderGroup<TData>[];
}): ReactNode => (
  <TableThead>
    {headerGroups.map((headerGroup) => (
      <TableTr key={headerGroup.id}>
        {headerGroup.headers.map((header) => {
          const canSort = header.column.getCanSort();
          const sortDirection = header.column.getIsSorted();
          return (
            <TableTh
              key={header.id}
              c="var(--hermes-ink-muted)"
              fz={11}
              lts="0.08em"
              tt="uppercase"
              onClick={
                canSort ? header.column.getToggleSortingHandler() : undefined
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
                  <Tooltip label={sortTooltipFor(sortDirection)} withArrow>
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
);
