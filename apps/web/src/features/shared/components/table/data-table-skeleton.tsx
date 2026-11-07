"use client";

import {
  Card,
  Group,
  ScrollArea,
  Skeleton,
  Stack,
  Table,
  TableTbody,
  TableTd,
  TableTh,
  TableThead,
  TableTr,
} from "@mantine/core";
import type { ReactNode } from "react";

const COLUMNS = ["col-0", "col-1", "col-2", "col-3", "col-4", "col-5"];
const ROWS = ["row-0", "row-1", "row-2", "row-3", "row-4", "row-5"];

interface DataTableSkeletonProps {
  columnCount?: number;
  rowCount?: number;
}

/** Mirrors the table shell: same borders, row height and pagination strip. */
export const DataTableSkeleton = ({
  columnCount = 6,
  rowCount = 6,
}: DataTableSkeletonProps): ReactNode => {
  const columns = COLUMNS.slice(0, columnCount);
  const rows = ROWS.slice(0, rowCount);

  return (
    <Stack gap="md">
      <Card
        radius="lg"
        p={0}
        bg="var(--hermes-surface)"
        bd="1px solid var(--hermes-line)"
      >
        <ScrollArea type="scroll">
          <Table withTableBorder withColumnBorders>
            <TableThead>
              <TableTr>
                {columns.map((columnId, index) => (
                  <TableTh key={columnId}>
                    <Skeleton
                      height={12}
                      width={`${Math.max(40, 78 - index * 10)}%`}
                      radius="xl"
                    />
                  </TableTh>
                ))}
              </TableTr>
            </TableThead>
            <TableTbody>
              {rows.map((rowId) => (
                <TableTr key={rowId} h={52}>
                  {columns.map((columnId, index) => (
                    <TableTd key={`${rowId}-${columnId}`}>
                      <Skeleton
                        height={index === 1 ? 26 : 14}
                        width={`${Math.max(30, 78 - index * 14)}%`}
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
        <Skeleton height={14} width={180} radius="xl" />
        <Skeleton height={32} width={210} radius="md" />
      </Group>
    </Stack>
  );
};
