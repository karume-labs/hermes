"use client";

import { Badge, Card, Group, Stack, Text } from "@mantine/core";
import type { ColumnDef } from "@tanstack/react-table";
import type { ReactNode } from "react";
import { useMemo } from "react";
import { useWebhookLogs } from "@/features/admin/services/queries";
import { DataTable } from "@/features/shared/components/table/data-table";

interface WebhookEntry {
  id: string;
  source: string;
  ok: boolean;
  status: string;
  detail: unknown;
  createdAt: string;
}

export const WebhookLogTable = (): ReactNode => {
  const logs = useWebhookLogs();
  const entries: WebhookEntry[] = logs.data === undefined ? [] : logs.data;
  const accepted = entries.filter((entry) => entry.ok).length;

  const columns = useMemo<ColumnDef<WebhookEntry, unknown>[]>(
    () => [
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
          <Badge
            color={row.original.ok ? "teal" : "red"}
            variant="light"
            tt="capitalize"
          >
            {row.original.ok ? "accepted" : "rejected"}
          </Badge>
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
    ],
    [],
  );

  return (
    <Stack gap="md">
      <Group justify="space-between">
        <Stack gap={2}>
          <Text fw={700}>Lab webhook log</Text>
          <Text size="sm" c="dimmed">
            FHIR Observation and HL7 ORU calls received by the ingestion edge.
          </Text>
        </Stack>
        <Group gap="xs">
          <Badge variant="light">{entries.length} calls</Badge>
          <Badge color="teal" variant="light">
            {accepted} accepted
          </Badge>
          <Badge color="red" variant="light">
            {entries.length - accepted} rejected
          </Badge>
        </Group>
      </Group>

      {logs.isLoading ? (
        <Card radius="sm" p="lg">
          <Text size="sm" c="dimmed">
            Loading webhook calls…
          </Text>
        </Card>
      ) : (
        <DataTable
          data={entries}
          columns={columns}
          minWidth={720}
          pageSize={10}
          emptyMessage="No lab feeds received yet"
        />
      )}
    </Stack>
  );
};
