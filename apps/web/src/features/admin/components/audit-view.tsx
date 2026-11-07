"use client";

import {
  Alert,
  Badge,
  Group,
  SimpleGrid,
  Stack,
  TextInput,
} from "@mantine/core";
import { IconSearch } from "@tabler/icons-react";
import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import { auditColumns } from "@/features/admin/components/audit-columns";
import { useAdminAudit } from "@/features/admin/services/queries";
import { PageHeader } from "@/features/shared/components/layout/page-header";
import { DataTable } from "@/features/shared/components/table/data-table";
import { MetricCard } from "@/features/shared/components/ui/metric-card";

export const AuditView = (): ReactNode => {
  const [search, setSearch] = useState("");
  const audit = useAdminAudit();
  const rows = audit.data === undefined ? [] : audit.data;
  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (term === "") return rows;
    return rows.filter(
      (row) =>
        row.action.toLowerCase().includes(term) ||
        row.actor.toLowerCase().includes(term) ||
        row.patientName.toLowerCase().includes(term),
    );
  }, [rows, search]);
  const actors = new Set(rows.map((row) => row.actor)).size;
  const cases = new Set(rows.map((row) => row.caseId)).size;

  return (
    <Stack gap="xl">
      <PageHeader
        eyebrow="Administration"
        title="Audit trail"
        subtitle="The latest clinical and access events across every clinic, newest first."
      />

      {audit.isError ? (
        <Alert color="red" title="Audit unavailable">
          The API rejected the request. Only an administrator can read the
          global audit trail.
        </Alert>
      ) : null}

      <SimpleGrid cols={{ base: 1, sm: 3 }}>
        <MetricCard
          label="Events"
          value={rows.length}
          hint="Most recent 100 events"
        />
        <MetricCard label="Actors" value={actors} hint="People and services" />
        <MetricCard
          label="Affected results"
          value={cases}
          hint="Cases carrying these events"
          tone="orange.7"
        />
      </SimpleGrid>

      <Group justify="space-between">
        <TextInput
          placeholder="Search action, actor or patient"
          leftSection={<IconSearch size={16} />}
          value={search}
          onChange={(event) => setSearch(event.currentTarget.value)}
          w={{ base: "100%", sm: 380 }}
        />
        <Badge variant="light">{visible.length} events</Badge>
      </Group>

      <DataTable
        data={visible}
        columns={auditColumns}
        loading={audit.isLoading}
        emptyMessage="No audit events match this search"
        minWidth={1040}
      />
    </Stack>
  );
};
