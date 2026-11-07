"use client";

import { Alert, SimpleGrid, Stack } from "@mantine/core";
import { parseAsString, useQueryState } from "nuqs";
import type { ReactNode } from "react";
import { auditColumns } from "@/features/admin/components/audit-columns";
import { useAdminAudit } from "@/features/admin/services/queries";
import { PageHeader } from "@/features/shared/components/layout/page-header";
import { DataTable } from "@/features/shared/components/table/data-table";
import { DataToolbar } from "@/features/shared/components/table/data-toolbar";
import {
  DataToolbarSearch,
  DataToolbarSelect,
} from "@/features/shared/components/table/data-toolbar-fields";
import { MetricCard } from "@/features/shared/components/ui/metric-card";

export const AuditView = (): ReactNode => {
  const [search, setSearch] = useQueryState("q", parseAsString.withDefault(""));
  const [action, setAction] = useQueryState(
    "action",
    parseAsString.withDefault(""),
  );
  const audit = useAdminAudit();
  const rows = audit.data === undefined ? [] : audit.data;

  const actions = [...new Set(rows.map((row) => row.action))].sort();
  const term = search.trim().toLowerCase();
  const visible = rows.filter((row) => {
    if (action !== "" && row.action !== action) return false;
    if (term === "") return true;
    return (
      row.action.toLowerCase().includes(term) ||
      row.actor.toLowerCase().includes(term) ||
      row.patientName.toLowerCase().includes(term)
    );
  });
  const actors = new Set(rows.map((row) => row.actor)).size;
  const cases = new Set(rows.map((row) => row.caseId)).size;

  const filtersActive = search !== "" || action !== "";

  return (
    <Stack gap="xl">
      <PageHeader
        eyebrow="Administration"
        title="Audit trail"
        subtitle="Every clinical and access event across all clinics, newest first."
      />

      {audit.isError ? (
        <Alert color="red" title="Audit trail could not load">
          Only an administrator can read the global audit trail.
        </Alert>
      ) : null}

      <SimpleGrid cols={{ base: 1, sm: 3 }}>
        <MetricCard
          label="Events"
          value={rows.length}
          hint="The 100 most recent"
        />
        <MetricCard label="People and services" value={actors} hint="Actors" />
        <MetricCard
          label="Results touched"
          value={cases}
          hint="Cases carrying these events"
        />
      </SimpleGrid>

      <DataToolbar
        title="Find an event"
        description="Action, person or patient"
        filtersActive={filtersActive}
        activeFilterCount={
          [search, action].filter((entry) => entry !== "").length
        }
        onClear={() => {
          void setSearch("");
          void setAction("");
        }}
        search={
          <DataToolbarSearch
            value={search}
            onChange={(next) => void setSearch(next)}
            placeholder="Search an action, actor or patient"
          />
        }
      >
        <DataToolbarSelect
          label="Action"
          placeholder="Any action"
          data={actions.map((entry) => ({
            value: entry,
            label: entry.replaceAll("_", " "),
          }))}
          value={action === "" ? null : action}
          onChange={(next) => void setAction(next === null ? "" : next)}
          description="Each action is one recorded event type."
        />
      </DataToolbar>

      <DataTable
        data={visible}
        columns={auditColumns}
        loading={audit.isLoading}
        emptyMessage="No events match these filters"
        onClearFilters={() => {
          void setSearch("");
          void setAction("");
        }}
        minWidth={1040}
      />
    </Stack>
  );
};
