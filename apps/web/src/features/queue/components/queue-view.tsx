"use client";

import { Alert, Button, Group, Stack } from "@mantine/core";
import { IconPlus, IconRefresh } from "@tabler/icons-react";
import { parseAsString, useQueryState } from "nuqs";
import type { ReactNode } from "react";
import { useMemo } from "react";
import { useEscalateCase } from "@/features/cases/services/mutations-case";
import { createQueueColumns } from "@/features/queue/components/queue-columns";
import { QueueFilters } from "@/features/queue/components/queue-filters";
import { QueueMetrics } from "@/features/queue/components/queue-metrics";
import { useIngestLabResult } from "@/features/queue/services/ingest";
import { useQueueCases } from "@/features/queue/services/queries";
import { PageHeader } from "@/features/shared/components/layout/page-header";
import { DataTable } from "@/features/shared/components/table/data-table";

export const QueueView = (): ReactNode => {
  const [severity, setSeverity] = useQueryState(
    "severity",
    parseAsString.withDefault(""),
  );
  const [status, setStatus] = useQueryState(
    "status",
    parseAsString.withDefault(""),
  );
  const [ownership, setOwnership] = useQueryState(
    "ownership",
    parseAsString.withDefault(""),
  );
  const [overdue, setOverdue] = useQueryState(
    "overdue",
    parseAsString.withDefault(""),
  );
  const list = useQueueCases(
    severity,
    status,
    ownership === "mine" ? "me" : "",
    ownership === "unassigned" ? "true" : "",
    overdue,
  );
  const escalate = useEscalateCase();
  const ingest = useIngestLabResult();

  const cases = list.cases;
  const pending = cases.filter(
    (item) =>
      item.acknowledgedAt === null &&
      (item.status === "notified" || item.status === "escalated"),
  ).length;
  const breached = cases.filter(
    (item) =>
      new Date(item.slaDueAt).getTime() < Date.now() &&
      item.acknowledgedAt === null,
  ).length;
  const unassigned = cases.filter((item) => item.assignedToId === null).length;
  const oldestId = cases[0]?.id;
  const filtersActive =
    severity !== "" || status !== "" || ownership !== "" || overdue !== "";

  const columns = useMemo(
    () =>
      createQueueColumns({
        escalatingId: escalate.isPending ? (escalate.variables ?? null) : null,
        onEscalate: (caseId) => escalate.mutate(caseId),
      }),
    [escalate],
  );

  return (
    <Stack gap="xl">
      <PageHeader
        eyebrow="Care team"
        title="Loop-closure queue"
        subtitle="Screening results awaiting acknowledgment, booking or clinical sign-off. Sorted by SLA due time, refreshed every 30 seconds."
        actions={
          <Group gap="xs">
            <Button
              variant="default"
              leftSection={<IconRefresh size={16} />}
              loading={ingest.isPending}
              onClick={() => ingest.mutate()}
            >
              Ingest lab result
            </Button>
            <Button
              leftSection={<IconPlus size={16} />}
              disabled={oldestId === undefined}
              onClick={() => {
                if (oldestId !== undefined) escalate.mutate(oldestId);
              }}
            >
              Escalate oldest
            </Button>
          </Group>
        }
      />

      {list.isError ? (
        <Alert color="red" title="Queue unavailable">
          The API rejected the request. Check that it is running on
          localhost:18003.
        </Alert>
      ) : null}

      <QueueMetrics
        total={cases.length}
        pending={pending}
        breached={breached}
        unassigned={unassigned}
      />

      <QueueFilters
        value={{ severity, status, ownership, overdue }}
        count={cases.length}
        filtersActive={filtersActive}
        onChange={(patch) => {
          if (patch.severity !== undefined) void setSeverity(patch.severity);
          if (patch.status !== undefined) void setStatus(patch.status);
          if (patch.ownership !== undefined) void setOwnership(patch.ownership);
          if (patch.overdue !== undefined) void setOverdue(patch.overdue);
        }}
      />

      <DataTable
        data={cases}
        columns={columns}
        loading={list.isLoading}
        emptyMessage="No cases match these filters"
        onClearFilters={() => {
          void setSeverity("");
          void setStatus("");
          void setOwnership("");
          void setOverdue("");
        }}
        rowClassName={(row) => {
          const breached =
            new Date(row.slaDueAt).getTime() < Date.now() &&
            row.acknowledgedAt === null;
          if (row.status === "escalated") return "hermes-escalated";
          return breached ? "hermes-sla-breached" : undefined;
        }}
      />
    </Stack>
  );
};
