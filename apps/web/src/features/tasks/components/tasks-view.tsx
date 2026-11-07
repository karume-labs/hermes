"use client";

import { Alert, SimpleGrid, Stack } from "@mantine/core";
import { parseAsString, useQueryState } from "nuqs";
import type { ReactNode } from "react";
import { useMemo } from "react";
import { useCompleteTask } from "@/features/cases/services/mutations-outcome";
import { PageHeader } from "@/features/shared/components/layout/page-header";
import { DataTable } from "@/features/shared/components/table/data-table";
import { DataToolbar } from "@/features/shared/components/table/data-toolbar";
import {
  DataToolbarSearch,
  DataToolbarSelect,
} from "@/features/shared/components/table/data-toolbar-fields";
import { MetricCard } from "@/features/shared/components/ui/metric-card";
import { createTaskColumns } from "@/features/tasks/components/task-columns";
import { useTasks } from "@/features/tasks/services/queries";

const KIND_OPTIONS = [
  { value: "escalation", label: "Escalation" },
  { value: "overdue", label: "Overdue follow-up" },
  { value: "referral", label: "Referral" },
  { value: "assignment", label: "Ownership" },
  { value: "surveillance_review", label: "Surveillance review" },
  { value: "patient_followup", label: "Patient asked for help" },
];

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

      <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }}>
        <MetricCard
          label="In view"
          value={tasks.length}
          hint={status === "open" ? "Still waiting" : "Completed"}
        />
        <MetricCard
          label="Late"
          value={overdue}
          hint="Past the due date"
          emphasis={overdue > 0 ? "alert" : "none"}
        />
        <MetricCard
          label="Reviews"
          value={reviews}
          hint="Scheduled result reviews"
        />
        <MetricCard
          label="Asked for help"
          value={followUps}
          hint="Patients who said they need a hand"
          emphasis={followUps > 0 ? "attention" : "none"}
        />
      </SimpleGrid>

      <DataToolbar
        title="Find a task"
        description="Kind, status and free text"
        filtersActive={filtersActive}
        activeFilterCount={
          [search, kind].filter((entry) => entry !== "").length +
          (status === "open" ? 0 : 1)
        }
        onClear={() => {
          void setStatus("open");
          void setKind("");
          void setSearch("");
        }}
        search={
          <DataToolbarSearch
            value={search}
            onChange={(next) => void setSearch(next)}
            placeholder="Search a task or its detail"
          />
        }
      >
        <DataToolbarSelect
          label="Kind"
          placeholder="Any kind"
          data={KIND_OPTIONS}
          value={kind === "" ? null : kind}
          onChange={(next) => void setKind(next === null ? "" : next)}
          description="What created the task."
        />
        <DataToolbarSelect
          label="Status"
          placeholder="Open"
          data={[
            { value: "open", label: "Open" },
            { value: "done", label: "Done" },
          ]}
          value={status}
          onChange={(next) => void setStatus(next === null ? "open" : next)}
          description="Done tasks stay listed until you clear the filter."
        />
      </DataToolbar>

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
