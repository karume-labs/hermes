"use client";

import { Card, Group, Stack, Text } from "@mantine/core";
import { parseAsString, useQueryState } from "nuqs";
import type { ReactNode } from "react";
import type { WebhookEntry } from "@/features/admin/components/webhook-columns";
import { webhookColumns } from "@/features/admin/components/webhook-columns";
import { useWebhookLogs } from "@/features/admin/services/queries";
import { DataTable } from "@/features/shared/components/table/data-table";
import { DataTableSkeleton } from "@/features/shared/components/table/data-table-skeleton";
import { DataToolbar } from "@/features/shared/components/table/data-toolbar";
import {
  DataToolbarSearch,
  DataToolbarSelect,
} from "@/features/shared/components/table/data-toolbar-fields";
import { Pill } from "@/features/shared/components/ui/pill";

const RESULTS = [
  { value: "accepted", label: "Accepted" },
  { value: "rejected", label: "Rejected" },
];

/**
 * Intake log for lab feeds. Filtering lives in the URL so a coordinator can
 * send an engineer the exact view of a failing integration.
 */
export const WebhookLogTable = (): ReactNode => {
  const logs = useWebhookLogs();
  const [search, setSearch] = useQueryState(
    "feed-q",
    parseAsString.withDefault(""),
  );
  const [result, setResult] = useQueryState(
    "feed-result",
    parseAsString.withDefault(""),
  );
  const entries: WebhookEntry[] = logs.data === undefined ? [] : logs.data;
  const accepted = entries.filter((entry) => entry.ok).length;

  const term = search.trim().toLowerCase();
  const filtered = entries.filter((entry) => {
    if (result === "accepted" && !entry.ok) return false;
    if (result === "rejected" && entry.ok) return false;
    if (term === "") return true;
    return (
      entry.source.toLowerCase().includes(term) ||
      entry.status.toLowerCase().includes(term)
    );
  });

  const columns = webhookColumns;

  return (
    <Stack gap="md">
      <Group justify="space-between" align="flex-start">
        <Stack gap={2}>
          <Text fw={700}>Lab webhook log</Text>
          <Text size="sm" c="dimmed">
            Every FHIR Observation and HL7 ORU call the ingestion edge received.
          </Text>
        </Stack>
        <Group gap="xs">
          <Pill tone="info">{entries.length} calls</Pill>
          <Pill tone="routine">{accepted} accepted</Pill>
          <Pill tone="urgent">{entries.length - accepted} rejected</Pill>
        </Group>
      </Group>

      <DataToolbar
        title="Find a call"
        description="Source, status and outcome"
        filtersActive={result !== "" || search !== ""}
        activeFilterCount={
          [result, search].filter((entry) => entry !== "").length
        }
        onClear={() => {
          void setResult("");
          void setSearch("");
        }}
        search={
          <DataToolbarSearch
            value={search}
            onChange={(next) => void setSearch(next)}
            placeholder="Search a source or HTTP status"
          />
        }
      >
        <DataToolbarSelect
          label="Outcome"
          placeholder="Accepted and rejected"
          data={RESULTS}
          value={result === "" ? null : result}
          onChange={(next) => void setResult(next === null ? "" : next)}
          description="Whether the signature check passed."
        />
      </DataToolbar>

      {logs.isLoading ? (
        <Card radius="sm" p="lg">
          <DataTableSkeleton columnCount={5} rowCount={6} />
        </Card>
      ) : (
        <DataTable
          data={filtered}
          columns={columns}
          minWidth={720}
          pageSize={10}
          emptyMessage="No lab feeds match this filter"
        />
      )}
    </Stack>
  );
};
