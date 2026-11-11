"use client";

import { Alert, Button, Group, Stack } from "@mantine/core";
import { parseAsString, parseAsStringLiteral, useQueryState } from "nuqs";
import type { ReactNode } from "react";
import { authClient } from "@/features/auth/services/client";
import {
  useAssignCase,
  useEscalateCase,
} from "@/features/cases/services/mutations-case";
import { QueueBoard } from "@/features/queue/components/queue-board";
import { QueueFilters } from "@/features/queue/components/queue-filters";
import { QueueMetrics } from "@/features/queue/components/queue-metrics";
import { useQueueCases } from "@/features/queue/services/queries";
import { PageHeader } from "@/features/shared/components/layout/page-header";

const SORTS = ["newest", "oldest"] as const;

const toApiSeverity = (value: string): string => {
  if (value === "urgent") return "Urgent";
  if (value === "actionable") return "Actionable";
  if (value === "routine") return "Routine";
  return "";
};

export const QueueView = (): ReactNode => {
  const { data: session } = authClient.useSession();
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
  const [search, setSearch] = useQueryState("q", parseAsString.withDefault(""));
  const [sort, setSort] = useQueryState(
    "sort",
    parseAsStringLiteral(SORTS).withDefault("newest"),
  );

  const list = useQueueCases(
    toApiSeverity(severity),
    status,
    ownership === "mine" ? "me" : "",
    ownership === "unassigned" ? "true" : "",
    overdue,
  );
  const escalate = useEscalateCase();
  const assign = useAssignCase();

  const term = search.trim().toLowerCase();
  const filtered = list.cases.filter((item) => {
    if (term === "") return true;
    return (
      item.patientName.toLowerCase().includes(term) ||
      item.patientPhone.toLowerCase().includes(term) ||
      item.id.toLowerCase().includes(term) ||
      item.summaryPlainLanguage.toLowerCase().includes(term)
    );
  });

  const cases = [...filtered].sort((left, right) => {
    const delta =
      new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
    return sort === "newest" ? delta : -delta;
  });

  const filtersActive =
    severity !== "" ||
    status !== "" ||
    ownership !== "" ||
    overdue !== "" ||
    search !== "";

  const clearAll = (): void => {
    void setSeverity("");
    void setStatus("");
    void setOwnership("");
    void setOverdue("");
    void setSearch("");
  };

  const pending = cases.filter(
    (item) =>
      item.acknowledgedAt === null &&
      (item.status === "notified" || item.status === "escalated"),
  ).length;
  const breached = cases.filter(
    (item) =>
      new Date(item.slaDueAt).getTime() < Date.now() &&
      item.acknowledgedAt === null &&
      item.status !== "closed",
  ).length;
  const unassigned = cases.filter((item) => item.assignedToId === null).length;

  return (
    <Stack gap="xl">
      <PageHeader
        eyebrow="Care team"
        title="Your queue"
        subtitle="Results that still need a person. The soonest deadline sits at the top; the list refreshes itself every 30 seconds."
      />

      {list.isError ? (
        <Alert color="red" title="The queue could not load">
          The dashboard could not reach the care API. Check that it is running,
          then reload this page.
        </Alert>
      ) : null}

      <QueueMetrics
        total={cases.length}
        pending={pending}
        breached={breached}
        unassigned={unassigned}
      />

      <QueueFilters
        value={{ severity, status, ownership, overdue, search }}
        filtersActive={filtersActive}
        sort={sort}
        onChange={(patch) => {
          if (patch.severity !== undefined) void setSeverity(patch.severity);
          if (patch.status !== undefined) void setStatus(patch.status);
          if (patch.ownership !== undefined) void setOwnership(patch.ownership);
          if (patch.overdue !== undefined) void setOverdue(patch.overdue);
          if (patch.search !== undefined) void setSearch(patch.search);
        }}
        onSortChange={(next) => void setSort(next)}
        onClear={clearAll}
      />

      <Group justify="flex-end">
        <Button
          variant="subtle"
          size="xs"
          onClick={() => {
            const userId = session?.user.id;
            if (userId === undefined) return;
            for (const item of cases) {
              if (item.assignedToId === null) {
                assign.mutate({ caseId: item.id, assignedToId: userId });
              }
            }
          }}
          disabled={unassigned === 0 || assign.isPending}
        >
          {unassigned === 0
            ? "Every case has an owner"
            : `Take the ${unassigned} unassigned case${unassigned === 1 ? "" : "s"}`}
        </Button>
      </Group>

      <QueueBoard
        cases={cases}
        escalatingId={escalate.isPending ? (escalate.variables ?? null) : null}
        onEscalate={(caseId) => escalate.mutate(caseId)}
        onAssign={(caseId) => {
          const userId = session?.user.id;
          if (userId === undefined) return;
          assign.mutate({ caseId, assignedToId: userId });
        }}
      />
    </Stack>
  );
};
