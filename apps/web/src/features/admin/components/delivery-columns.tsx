"use client";

import { Text } from "@mantine/core";
import type { ColumnDef } from "@tanstack/react-table";
import type { ReactNode } from "react";
import type { NotificationRow } from "@/features/admin/components/delivery-view-types";

import { Pill, type Tone } from "@/features/shared/components/ui/pill";

const STATUS_TONE: Record<string, Tone> = {
  failed: "urgent",
  queued: "actionable",
  sent: "routine",
  read: "info",
};

const statusTone = (status: string): Tone => {
  const tone = STATUS_TONE[status];
  return tone === undefined ? "info" : tone;
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
      <Pill tone="info">{row.original.channel}</Pill>
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
      <Pill tone={statusTone(row.original.status)}>{row.original.status}</Pill>
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
