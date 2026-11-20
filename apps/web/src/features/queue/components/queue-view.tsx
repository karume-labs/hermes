"use client";

import { Alert, Stack } from "@mantine/core";
import { IconStethoscope } from "@tabler/icons-react";
import type { ReactNode } from "react";
import { authClient } from "@/features/auth/services/client";
import {
  useAssignCase,
  useEscalateCase,
} from "@/features/cases/services/mutations-case";
import { QueueAssignAll } from "@/features/queue/components/queue-assign-all";
import { QueueBoard } from "@/features/queue/components/queue-board";
import { QueueFilters } from "@/features/queue/components/queue-filters";
import { QueueMetrics } from "@/features/queue/components/queue-metrics";
import { useQueueCases } from "@/features/queue/services/queries";
import { queueStats } from "@/features/queue/utils/queue-stats";
import { useQueueFilters } from "@/features/queue/utils/use-queue-filters";
import { PageHeader } from "@/features/shared/components/layout/page-header";

export const QueueView = (): ReactNode => {
  const { data: session } = authClient.useSession();
  const filters = useQueueFilters();
  const { ownership, overdue, search } = filters.value;

  const list = useQueueCases(
    filters.severityForApi,
    filters.value.status,
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
    return filters.sort === "newest" ? delta : -delta;
  });

  const { pending, breached, unassigned } = queueStats(cases);
  // Only a coordinator or clinician can own a case; the API refuses an admin
  // as an owner, so offering "assign to me" to one is a dead button.
  const role = session?.user.role;
  const clinicId = session?.user.clinicId;
  const canOwn = role === "coordinator" || role === "clinician";
  // A case handed over from another clinic is readable here but cannot gain an
  // owner from this clinic, so it is not part of "take them all".
  const ownable = cases.filter(
    (item) => item.assignedToId === null && item.clinicId === clinicId,
  );

  return (
    <Stack gap="xl">
      <PageHeader
        eyebrow="Care team"
        title="Your queue"
        subtitle="Results that still need a person. The soonest deadline sits at the top; the list refreshes itself every 30 seconds."
        icon={<IconStethoscope size={24} />}
        tone="info"
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
        value={filters.value}
        filtersActive={filters.filtersActive}
        sort={filters.sort}
        onChange={filters.apply}
        onSortChange={filters.setSort}
        onClear={filters.clear}
      />

      <QueueAssignAll
        cases={ownable}
        unassigned={ownable.length}
        canOwn={canOwn}
      />

      <QueueBoard
        cases={cases}
        canOwn={canOwn}
        clinicId={clinicId}
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
