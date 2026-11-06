"use client";

import type { AdminClinicSummary } from "@hermes/types";
import { Alert, Badge, SimpleGrid, Stack, Text } from "@mantine/core";
import type { ColumnDef } from "@tanstack/react-table";
import type { ReactNode } from "react";
import { useAdminClinics } from "@/features/admin/services/queries";
import { PageHeader } from "@/features/shared/components/layout/page-header";
import { DataTable } from "@/features/shared/components/table/data-table";
import { MetricCard } from "@/features/shared/components/ui/metric-card";

const columns: ColumnDef<AdminClinicSummary>[] = [
  {
    id: "clinic",
    header: "Clinic",
    accessorFn: (row) => row.name,
    cell: ({ row }) => (
      <Stack gap={0}>
        <Text size="sm" fw={600}>
          {row.original.name}
        </Text>
        <Text size="xs" c="dimmed">
          {row.original.id}
        </Text>
      </Stack>
    ),
  },
  {
    id: "timezone",
    header: "Timezone",
    accessorFn: (row) => row.timezone,
    cell: ({ row }) => <Text size="sm">{row.original.timezone}</Text>,
  },
  {
    id: "status",
    header: "Status",
    accessorFn: (row) => (row.isActive ? "active" : "inactive"),
    cell: ({ row }) => (
      <Badge variant="light" color={row.original.isActive ? "teal" : "gray"}>
        {row.original.isActive ? "Active" : "Inactive"}
      </Badge>
    ),
  },
  {
    id: "patients",
    header: "Patients",
    accessorFn: (row) => row.patientCount,
    cell: ({ row }) => <Text size="sm">{row.original.patientCount}</Text>,
  },
  {
    id: "staff",
    header: "Staff",
    accessorFn: (row) => row.staffCount,
    cell: ({ row }) => <Text size="sm">{row.original.staffCount}</Text>,
  },
  {
    id: "open",
    header: "Open cases",
    accessorFn: (row) => row.openCaseCount,
    cell: ({ row }) => (
      <Badge
        variant="light"
        color={row.original.openCaseCount > 0 ? "orange" : "teal"}
      >
        {row.original.openCaseCount}
      </Badge>
    ),
  },
];

export const ClinicsView = (): ReactNode => {
  const clinics = useAdminClinics();
  const rows = clinics.data === undefined ? [] : clinics.data;

  return (
    <Stack gap="xl">
      <PageHeader
        eyebrow="Administration"
        title="Clinics & tenancy"
        subtitle="Every clinic in the network with its staffing, patient population and open care load."
      />

      {clinics.isError ? (
        <Alert color="red" title="Clinics unavailable">
          The API rejected the request. Only an administrator can read the
          network directory.
        </Alert>
      ) : null}

      <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }}>
        <MetricCard
          label="Active clinics"
          value={rows.filter((row) => row.isActive).length}
          hint={`${rows.length} clinics in the network`}
        />
        <MetricCard
          label="Patients"
          value={rows.reduce((sum, row) => sum + row.patientCount, 0)}
          hint="Registered across all clinics"
        />
        <MetricCard
          label="Staff"
          value={rows.reduce((sum, row) => sum + row.staffCount, 0)}
          hint="Accounts assigned to a clinic"
        />
        <MetricCard
          label="Open cases"
          value={rows.reduce((sum, row) => sum + row.openCaseCount, 0)}
          hint="Still moving through the loop"
          tone="orange.7"
        />
      </SimpleGrid>

      <DataTable
        data={rows}
        columns={columns}
        loading={clinics.isLoading}
        emptyMessage="No clinics configured"
        minWidth={860}
      />
    </Stack>
  );
};
