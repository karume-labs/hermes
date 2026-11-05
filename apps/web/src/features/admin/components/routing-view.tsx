"use client";

import type { RoutingRule } from "@hermes/types";
import {
  Alert,
  Badge,
  Button,
  Card,
  Group,
  Stack,
  Switch,
  Text,
  Title,
} from "@mantine/core";
import type { ColumnDef } from "@tanstack/react-table";
import type { ReactNode } from "react";
import { useMemo } from "react";
import { RoutingRuleComposer } from "@/features/admin/components/routing-rule-form";
import {
  useDeleteRoutingRule,
  useUpsertRoutingRule,
} from "@/features/admin/services/mutations";
import { useRoutingRules } from "@/features/admin/services/queries";
import { DataTable } from "@/features/shared/components/table/data-table";
import { DataTableSkeleton } from "@/features/shared/components/table/data-toolbar";
import { errorMessage } from "@/features/shared/utils/form-errors";

export const RoutingView = (): ReactNode => {
  const rules = useRoutingRules();
  const upsert = useUpsertRoutingRule();
  const remove = useDeleteRoutingRule();
  const items = rules.data === undefined ? [] : rules.data;

  const columns = useMemo<ColumnDef<RoutingRule, unknown>[]>(
    () => [
      {
        id: "prefix",
        header: "Marker prefix",
        accessorFn: (row) => row.markerPrefix,
        cell: ({ row }): ReactNode => (
          <Text ff="monospace" size="sm">
            {row.original.markerPrefix}
          </Text>
        ),
      },
      {
        id: "clinic",
        header: "Clinic",
        accessorFn: (row) => row.clinicId,
        cell: ({ row }): ReactNode => (
          <Badge variant="light">{row.original.clinicId}</Badge>
        ),
      },
      {
        id: "active",
        header: "Active",
        accessorFn: (row) => (row.active ? 1 : 0),
        cell: ({ row }): ReactNode => (
          <Switch
            checked={row.original.active}
            onChange={(event) =>
              upsert.mutate({
                markerPrefix: row.original.markerPrefix,
                clinicId: row.original.clinicId,
                active: event.currentTarget.checked,
              })
            }
          />
        ),
      },
      {
        id: "actions",
        header: "",
        enableSorting: false,
        cell: ({ row }): ReactNode => (
          <Group justify="flex-end">
            <Button
              size="xs"
              variant="subtle"
              color="red"
              loading={remove.isPending}
              onClick={() => remove.mutate(row.original.id)}
            >
              Remove
            </Button>
          </Group>
        ),
      },
    ],
    [remove, upsert],
  );

  return (
    <Stack gap="lg">
      <div>
        <Title order={2}>Routing configuration</Title>
        <Text size="sm" c="dimmed">
          Incoming lab markers are matched by longest lowercase prefix.
          Unmatched results fall back to clinic-1.
        </Text>
      </div>

      {rules.isError || upsert.isError || remove.isError ? (
        <Alert color="red" title="Routing configuration failed">
          {errorMessage(
            rules.isError
              ? rules.error
              : upsert.isError
                ? upsert.error
                : remove.error,
          )}
        </Alert>
      ) : null}

      <Card withBorder radius="md" p="lg">
        <Title order={4} mb="sm">
          Add or replace a rule
        </Title>
        <RoutingRuleComposer />
      </Card>

      <Card withBorder radius="md" p="md">
        {rules.isLoading ? (
          <DataTableSkeleton rows={4} />
        ) : (
          <DataTable
            data={items}
            columns={columns}
            minWidth={560}
            emptyMessage="No routing rules configured; every result routes to clinic-1."
          />
        )}
      </Card>
    </Stack>
  );
};
