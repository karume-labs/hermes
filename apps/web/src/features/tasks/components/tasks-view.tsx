"use client";

import { Alert, Stack } from "@mantine/core";
import { parseAsString, useQueryState } from "nuqs";
import type { ReactNode } from "react";
import { useMemo } from "react";
import { useCompleteTask } from "@/features/cases/services/mutations-outcome";
import { PageHeader } from "@/features/shared/components/layout/page-header";
import { DataTable } from "@/features/shared/components/table/data-table";
import { createTaskColumns } from "@/features/tasks/components/task-columns";
import { TaskMetrics } from "@/features/tasks/components/task-metrics";
import { TaskToolbar } from "@/features/tasks/components/task-toolbar";
import { useTasks } from "@/features/tasks/services/queries";

export const TasksView = (): ReactNode => {
  const [status, setStatus] = useQueryState(
    "status",
    parseAsString.withDefault("open"),
  );
  const [kind, setKind] = useQueryState("kind", parseAsString.withDefault(""));
  const [search, setSearch] = useQueryState("q", parseAsString.withDefault(""));
  const list = useTasks(status);
  const complete = useCompleteTask();

  const tasks = list.tasks;
  const term = search.trim().toLowerCase();
  const visible = tasks.filter((task) => {
    if (kind !== "" && task.kind !== kind) return false;
    if (term === "") return true;
    const detail = task.detail === null ? "" : task.detail;
    return (
      task.title.toLowerCase().includes(term) ||
      detail.toLowerCase().includes(term)
    );
  });

  const overdue = tasks.filter(
    (task) =>
      task.dueAt !== null &&
      task.status === "open" &&
      new Date(task.dueAt).getTime() < Date.now(),
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

  const filtersActive = search !== "" || kind !== "" || status !== "open";

  return (
    <Stack gap="xl">
      <PageHeader
        eyebrow="Care team"
        title="Tasks"
        subtitle="Reminders, referrals, reviews and patient follow-ups that still need a person."
      />

      {list.isError ? (
        <Alert color="red" title="Tasks could not load">
          The dashboard could not reach the care API. Check that it is running.
        </Alert>
      ) : null}

      <TaskMetrics
        total={tasks.length}
        overdue={overdue}
        reviews={reviews}
        followUps={followUps}
        status={status}
      />

      <TaskToolbar
        search={search}
        kind={kind}
        status={status}
        filtersActive={filtersActive}
        onSearch={(next) => void setSearch(next)}
        onKind={(next) => void setKind(next)}
        onStatus={(next) => void setStatus(next)}
        onClear={() => {
          void setStatus("open");
          void setKind("");
          void setSearch("");
        }}
      />

      <DataTable
        data={visible}
        columns={columns}
        loading={list.isLoading}
        emptyMessage={
          status === "open"
            ? "No open tasks — the worklist is clear"
            : "No completed tasks yet"
        }
        onClearFilters={() => {
          void setStatus("open");
          void setKind("");
          void setSearch("");
        }}
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
