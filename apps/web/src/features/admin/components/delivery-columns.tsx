"use client";

import { Badge, Text } from "@mantine/core";
import type { ColumnDef } from "@tanstack/react-table";
import type { ReactNode } from "react";
import type { NotificationRow } from "@/features/admin/components/delivery-view-types";

const statusColor = (status: string): string => {
  if (status === "failed") return "red";
  if (status === "read") return "teal";
  if (status === "queued") return "orange";
  return "blue";
};

export const deliveryColumns: ColumnDef<NotificationRow, unknown>[] = [
  {
    id: "case",
    header: "Case",
    accessorFn: (row) => row.caseId,
    cell: ({ row }): ReactNode => (
      <Text size="xs" ff="monospace">
        {row.original.caseId.slice(0, 8)}
      </Text>
    ),
  },
  {
    id: "channel",
    header: "Channel",
    accessorFn: (row) => row.channel,
    cell: ({ row }): ReactNode => (
      <Badge variant="outline" tt="capitalize">
        {row.original.channel}
      </Badge>
    ),
  },
  {
    id: "kind",
    header: "Kind",
    accessorFn: (row) => row.kind,
    cell: ({ row }): ReactNode => <Text size="sm">{row.original.kind}</Text>,
  },
  {
    id: "status",
    header: "Status",
    accessorFn: (row) => row.status,
    cell: ({ row }): ReactNode => (
      <Badge color={statusColor(row.original.status)} variant="light">
        {row.original.status}
      </Badge>
    ),
  },
  {
    id: "attempts",
    header: "Attempts",
    accessorFn: (row) => row.attempts,
  },
  {
    id: "queued",
    header: "Queued",
    accessorFn: (row) => row.createdAt,
    cell: ({ row }): ReactNode => (
      <Text size="xs" c="dimmed">
        {new Date(row.original.createdAt).toLocaleString(undefined, {
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })}
      </Text>
    ),
  },
];
