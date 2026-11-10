"use client";

import type { RoutingRule } from "@hermes/types";
import { Alert, Card, Stack, Text } from "@mantine/core";
import type { ColumnDef } from "@tanstack/react-table";
import { parseAsString, useQueryState } from "nuqs";
import type { ReactNode } from "react";
import { useMemo } from "react";
import { routingColumns } from "@/features/admin/components/routing-columns";
import { RoutingRuleComposer } from "@/features/admin/components/routing-rule-form";
import {
  useDeleteRoutingRule,
  useUpsertRoutingRule,
} from "@/features/admin/services/mutations";
import { useRoutingRules } from "@/features/admin/services/queries";
import { PageHeader } from "@/features/shared/components/layout/page-header";
import { DataTable } from "@/features/shared/components/table/data-table";
import { DataTableSkeleton } from "@/features/shared/components/table/data-table-skeleton";
import { DataToolbar } from "@/features/shared/components/table/data-toolbar";
import { DataToolbarSearch } from "@/features/shared/components/table/data-toolbar-fields";
import { errorMessage } from "@/features/shared/utils/form-errors";

export const RoutingView = (): ReactNode => {
  const rules = useRoutingRules();
  const upsert = useUpsertRoutingRule();
  const remove = useDeleteRoutingRule();
  const [search, setSearch] = useQueryState(
    "rule-q",
    parseAsString.withDefault(""),
  );
  const items = rules.data === undefined ? [] : rules.data;
  const term = search.trim().toLowerCase();
  const filtered = items.filter(
    (rule) =>
      term === "" ||
      rule.markerPrefix.toLowerCase().includes(term) ||
      rule.clinicId.toLowerCase().includes(term),
  );

  const columns = useMemo<ColumnDef<RoutingRule, unknown>[]>(
    () =>
      routingColumns({
        upserting: upsert.isPending,
        removing: remove.isPending,
        onSetActive: (rule, active) =>
          upsert.mutate({
            markerPrefix: rule.markerPrefix,
            clinicId: rule.clinicId,
            active,
          }),
        onRemove: (id) => remove.mutate(id),
      }),
    [remove, upsert],
  );

  const error = rules.isError
    ? rules.error
    : upsert.isError
      ? upsert.error
      : remove.error;

  return (
    <Stack gap="xl">
      <PageHeader
        eyebrow="Administration"
        title="Routing configuration"
        subtitle="Incoming lab markers are matched by longest lowercase prefix. Unmatched results fall back to clinic-1."
      />

      {rules.isError || upsert.isError || remove.isError ? (
        <Alert color="red" title="Routing configuration failed">
          {errorMessage(error)}
        </Alert>
      ) : null}

      <Card
        radius="sm"
        p="xl"
        bg="var(--hermes-surface)"
        bd="1px solid var(--hermes-line)"
      >
        <Text fw={700} mb="lg">
          Add or replace a rule
        </Text>
        <RoutingRuleComposer />
      </Card>

      <Card
        radius="sm"
        p="lg"
        bg="var(--hermes-surface)"
        bd="1px solid var(--hermes-line)"
      >
        <Stack gap="md">
          <DataToolbar
            title="Find a rule"
            description="Marker prefix or clinic"
            filtersActive={search !== ""}
            activeFilterCount={search === "" ? 0 : 1}
            onClear={() => void setSearch("")}
            search={
              <DataToolbarSearch
                value={search}
                onChange={(next) => void setSearch(next)}
                placeholder="Search a marker prefix or clinic"
              />
            }
          >
            <Text size="sm" c="dimmed">
              Rules apply to new results only; cases already in the queue keep
              the clinic they were routed to.
            </Text>
          </DataToolbar>

          {rules.isLoading ? (
            <DataTableSkeleton columnCount={4} rowCount={4} />
          ) : (
            <DataTable
              data={filtered}
              columns={columns}
              minWidth={560}
              emptyMessage="No routing rules match this search"
            />
          )}
        </Stack>
      </Card>
    </Stack>
  );
};
