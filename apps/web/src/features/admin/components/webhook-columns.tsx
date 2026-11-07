"use client";

import { Text } from "@mantine/core";
import type { ColumnDef } from "@tanstack/react-table";
import type { ReactNode } from "react";
import { Pill } from "@/features/shared/components/ui/pill";

export interface WebhookEntry {
  id: string;
  source: string;
  ok: boolean;
  status: string;
  detail: unknown;
  createdAt: string;
}

export const webhookColumns: ColumnDef<WebhookEntry, unknown>[] = [
  {
    id: "source",
    header: "Source",
    accessorFn: (row) => row.source,
    cell: ({ row }): ReactNode => (
      <Text size="sm" fw={600}>
        {row.original.source}
      </Text>
    ),
  },
  {
    id: "result",
    header: "Result",
    accessorFn: (row) => (row.ok ? "accepted" : "rejected"),
    cell: ({ row }): ReactNode => (
      <Pill tone={row.original.ok ? "routine" : "urgent"}>
        {row.original.ok ? "Accepted" : "Rejected"}
      </Pill>
    ),
  },
  {
    id: "status",
    header: "HTTP",
    accessorFn: (row) => row.status,
    cell: ({ row }): ReactNode => (
      <Text size="sm" ff="monospace">
        {row.original.status}
      </Text>
    ),
  },
  {
    id: "detail",
    header: "Detail",
    enableSorting: false,
    cell: ({ row }): ReactNode => (
      <Text size="xs" c="dimmed" maw={280} lineClamp={2}>
        {JSON.stringify(row.original.detail)}
      </Text>
    ),
  },
  {
    id: "received",
    header: "Received",
    accessorFn: (row) => row.createdAt,
    cell: ({ row }): ReactNode => (
      <Text size="xs" c="dimmed">
        {new Date(row.original.createdAt).toLocaleString()}
      </Text>
    ),
  },
];
