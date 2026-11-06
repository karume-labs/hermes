"use client";

import {
  Alert,
  Badge,
  Group,
  SegmentedControl,
  SimpleGrid,
  Stack,
} from "@mantine/core";
import { parseAsString, useQueryState } from "nuqs";
import type { ReactNode } from "react";
import { useMemo } from "react";
import { useCompleteTask } from "@/features/cases/services/mutations";
import { PageHeader } from "@/features/shared/components/layout/page-header";
import { DataTable } from "@/features/shared/components/table/data-table";
import { MetricCard } from "@/features/shared/components/ui/metric-card";
import { createTaskColumns } from "@/features/tasks/components/task-columns";
import { useTasks } from "@/features/tasks/services/queries";

export const TasksView = (): ReactNode => {
  const [status, setStatus] = useQueryState(
    "status",
    parseAsString.withDefault("open"),
  );
  const list = useTasks(status);
  const complete = useCompleteTask();

  const tasks = list.tasks;
  const overdue = tasks.filter(
    (task) =>
      task.dueAt !== null && new Date(task.dueAt).getTime() < Date.now(),
  ).length;
  const followUps = tasks.filter(
    (task) => task.kind === "patient_followup",
  ).length;
  const reviews = tasks.filter(
    (task) => task.kind === "surveillance_review",
  ).length;

  const columns = useMemo(
    () =>
      createTaskColumns({
        completingId: complete.isPending ? (complete.variables ?? null) : null,
        onComplete: (taskId) => complete.mutate(taskId),
      }),
    [complete],
  );

  return (
    <Stack gap="xl">
      <PageHeader
        eyebrow="Care team"
        title="Task worklist"
        subtitle="Every reminder, referral, surveillance review and patient follow-up that still needs a person. Refreshed every 30 seconds."
        actions={
          <SegmentedControl
            value={status}
            onChange={(value) => void setStatus(value)}
            data={[
              { value: "open", label: "Open" },
              { value: "done", label: "Done" },
            ]}
          />
        }
      />

      {list.isError ? (
        <Alert color="red" title="Tasks unavailable">
          The API rejected the request. Check that it is running on
          localhost:18003.
        </Alert>
      ) : null}

      <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }}>
        <MetricCard
          label="In view"
          value={tasks.length}
          hint={status === "open" ? "Tasks still waiting" : "Completed tasks"}
        />
        <MetricCard
          label="Overdue"
          value={overdue}
          hint="Past the due date"
          tone={overdue > 0 ? "red.7" : "brandSlate.9"}
        />
        <MetricCard
          label="Surveillance"
          value={reviews}
          hint="Scheduled result reviews"
          tone={reviews > 0 ? "teal.7" : "brandSlate.9"}
        />
        <MetricCard
          label="Patient follow-up"
          value={followUps}
          hint="Teach-back said help is needed"
          tone={followUps > 0 ? "orange.7" : "brandSlate.9"}
        />
      </SimpleGrid>

      <Group>
        <Badge variant="light">{tasks.length} tasks</Badge>
      </Group>

      <DataTable
        data={tasks}
        columns={columns}
        loading={list.isLoading}
        emptyMessage={
          status === "open"
            ? "No open tasks — the worklist is clear"
            : "No completed tasks yet"
        }
        rowClassName={(row) =>
          row.dueAt !== null &&
          row.status === "open" &&
          new Date(row.dueAt).getTime() < Date.now()
            ? "hermes-sla-breached"
            : undefined
        }
      />
    </Stack>
  );
};
