"use client";

import {
  Alert,
  Badge,
  Button,
  Card,
  Group,
  Select,
  SimpleGrid,
  Stack,
  Text,
} from "@mantine/core";
import { parseAsString, useQueryState } from "nuqs";
import type { ReactNode } from "react";
import { useMemo } from "react";
import { useEscalateCase } from "@/features/cases/services/mutations";
import { createQueueColumns } from "@/features/queue/components/queue-columns";
import { useIngestDemo } from "@/features/queue/services/ingest";
import { useQueueCases } from "@/features/queue/services/queries";
import { PageHeader } from "@/features/shared/components/layout/page-header";
import { DataTable } from "@/features/shared/components/table/data-table";
import {
  DataTableSkeleton,
  DataToolbar,
} from "@/features/shared/components/table/data-toolbar";

const severityOptions = ["", "Routine", "Actionable", "Urgent"];
const statusOptions = [
  "",
  "received",
  "triaged",
  "notified",
  "acknowledged",
  "appointment_booked",
  "referred",
  "escalated",
  "closed",
];

type StatCardProps = {
  label: string;
  value: number;
  tone?: string;
};

const StatCard = ({ label, value, tone }: StatCardProps): ReactNode => (
  <Card withBorder radius="md" p="md">
    <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
      {label}
    </Text>
    <Text size="xl" fw={700} c={tone}>
      {value}
    </Text>
  </Card>
);

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
  const ingest = useIngestDemo();

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

  const columns = useMemo(
    () =>
      createQueueColumns({
        escalatingId: escalate.isPending ? (escalate.variables ?? null) : null,
        onEscalate: (caseId) => escalate.mutate(caseId),
      }),
    [escalate],
  );

  return (
    <Stack gap="lg">
      <PageHeader
        title="Loop-closure queue"
        subtitle="Screening results awaiting acknowledgment, booking or clinical sign-off."
        actions={
          <Group gap="xs">
            <Button
              variant="light"
              loading={ingest.isPending}
              onClick={() => ingest.mutate()}
            >
              Ingest demo case
            </Button>
            <Button
              variant="default"
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

      <SimpleGrid cols={{ base: 2, sm: 4 }}>
        <StatCard label="In view" value={cases.length} />
        <StatCard
          label="Pending ack"
          value={pending}
          tone={pending > 0 ? "orange.7" : undefined}
        />
        <StatCard
          label="SLA breached"
          value={breached}
          tone={breached > 0 ? "red.7" : undefined}
        />
        <StatCard
          label="Urgent"
          value={urgent}
          tone={urgent > 0 ? "red.7" : undefined}
        />
      </SimpleGrid>

      <Card withBorder radius="md" p="md">
        <Stack gap="md">
          <DataToolbar
            title="Active cases"
            meta={<Badge variant="light">{cases.length}</Badge>}
            description="30s auto-refresh · sorted by SLA due time"
          >
            <Select
              size="xs"
              w={150}
              label="Severity"
              value={severity}
              onChange={(value) => setSeverity(value === null ? "" : value)}
              data={severityOptions}
              clearable
            />
            <Select
              size="xs"
              w={180}
              label="Status"
              value={status}
              onChange={(value) => setStatus(value === null ? "" : value)}
              data={statusOptions}
              clearable
            />
          </DataToolbar>

          {list.isLoading ? (
            <DataTableSkeleton />
          ) : (
            <DataTable
              data={cases}
              columns={columns}
              emptyMessage="No cases match these filters. Ingest a demo case to exercise the loop."
              rowClassName={(row) =>
                new Date(row.slaDueAt).getTime() < Date.now() &&
                row.acknowledgedAt === null
                  ? "sla-breached"
                  : undefined
              }
            />
          )}
        </Stack>
      </Card>
    </Stack>
  );
};
