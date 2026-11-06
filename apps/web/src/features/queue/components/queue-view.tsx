"use client";

import {
  Alert,
  Badge,
  Button,
  Group,
  Select,
  SimpleGrid,
  Stack,
} from "@mantine/core";
import { IconPlus, IconRefresh } from "@tabler/icons-react";
import { parseAsString, useQueryState } from "nuqs";
import type { ReactNode } from "react";
import { useMemo } from "react";
import { useEscalateCase } from "@/features/cases/services/mutations";
import { createQueueColumns } from "@/features/queue/components/queue-columns";
import { useIngestLabResult } from "@/features/queue/services/ingest";
import { useQueueCases } from "@/features/queue/services/queries";
import { PageHeader } from "@/features/shared/components/layout/page-header";
import { DataTable } from "@/features/shared/components/table/data-table";
import { DataToolbar } from "@/features/shared/components/table/data-toolbar";
import { MetricCard } from "@/features/shared/components/ui/metric-card";

const severityOptions = ["Routine", "Actionable", "Urgent"];
const statusOptions = [
  "received",
  "triaged",
  "notified",
  "acknowledged",
  "appointment_booked",
  "referred",
  "escalated",
  "closed",
];

export const QueueView = (): ReactNode => {
  const [severity, setSeverity] = useQueryState(
    "severity",
    parseAsString.withDefault(""),
  );
  const [status, setStatus] = useQueryState(
    "status",
    parseAsString.withDefault(""),
  );
  const list = useQueueCases(severity, status);
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
  const urgent = cases.filter((item) => item.severity === "Urgent").length;
  const oldestId = cases[0]?.id;
  const filtersActive = severity !== "" || status !== "";

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

      <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }}>
        <MetricCard
          label="In view"
          value={cases.length}
          hint="Cases matching the current filters"
        />
        <MetricCard
          label="Pending ack"
          value={pending}
          hint="Notified or escalated without a patient tap"
          tone={pending > 0 ? "orange.7" : "brandSlate.9"}
        />
        <MetricCard
          label="SLA breached"
          value={breached}
          hint="Past due with no acknowledgment"
          tone={breached > 0 ? "red.7" : "brandSlate.9"}
        />
        <MetricCard
          label="Urgent"
          value={urgent}
          hint="Graded urgent by triage"
          tone={urgent > 0 ? "red.7" : "brandSlate.9"}
        />
      </SimpleGrid>

      <DataToolbar
        title="Active cases"
        description="Filter by clinical severity or workflow status"
        meta={<Badge variant="light">{cases.length}</Badge>}
        filtersActive={filtersActive}
        activeFilterCount={(severity === "" ? 0 : 1) + (status === "" ? 0 : 1)}
        onClear={() => {
          void setSeverity("");
          void setStatus("");
        }}
      >
        <Select
          label="Severity"
          placeholder="All severities"
          value={severity === "" ? null : severity}
          onChange={(value) => void setSeverity(value ?? "")}
          data={severityOptions}
          clearable
        />
        <Select
          label="Workflow status"
          placeholder="All statuses"
          value={status === "" ? null : status}
          onChange={(value) => void setStatus(value ?? "")}
          data={statusOptions}
          clearable
        />
      </DataToolbar>

      <DataTable
        data={cases}
        columns={columns}
        loading={list.isLoading}
        emptyMessage="No cases match these filters"
        onClearFilters={() => {
          void setSeverity("");
          void setStatus("");
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
