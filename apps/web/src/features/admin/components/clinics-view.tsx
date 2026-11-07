"use client";

import type { AdminClinicSummary } from "@hermes/types";
import { Alert, Button, SimpleGrid, Stack } from "@mantine/core";
import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import { buildClinicColumns } from "@/features/admin/components/clinic-columns";
import { ClinicFormModal } from "@/features/admin/components/clinic-form-modal";
import { useAdminClinics } from "@/features/admin/services/queries";
import { PageHeader } from "@/features/shared/components/layout/page-header";
import { DataTable } from "@/features/shared/components/table/data-table";
import { MetricCard } from "@/features/shared/components/ui/metric-card";

export const ClinicsView = (): ReactNode => {
  const clinics = useAdminClinics();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<AdminClinicSummary | null>(null);
  const rows = clinics.data === undefined ? [] : clinics.data;
  const columns = useMemo(
    () =>
      buildClinicColumns((clinic) => {
        setEditing(clinic);
        setFormOpen(true);
      }),
    [],
  );

  return (
    <Stack gap="xl">
      <PageHeader
        eyebrow="Administration"
        title="Clinics & tenancy"
        subtitle="Every clinic in the network with its staffing, patient population and open care load."
        actions={
          <Button
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            Add clinic
          </Button>
        }
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
        minWidth={920}
      />

      <ClinicFormModal
        opened={formOpen}
        clinic={editing}
        onClose={() => setFormOpen(false)}
      />
    </Stack>
  );
};
