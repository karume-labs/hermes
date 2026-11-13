"use client";

import type { AdminClinicSummary } from "@hermes/types";
import { SimpleGrid } from "@mantine/core";
import type { ReactNode } from "react";
import { MetricCard } from "@/features/shared/components/ui/metric-card";

interface ClinicMetricsProps {
  rows: AdminClinicSummary[];
}

export const ClinicMetrics = ({ rows }: ClinicMetricsProps): ReactNode => {
  const openCases = rows.reduce((sum, row) => sum + row.openCaseCount, 0);

  return (
    <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }}>
      <MetricCard
        label="Open clinics"
        value={rows.filter((row) => row.isActive).length}
        hint={`${rows.length} in the network`}
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
        label="Open results"
        value={openCases}
        hint="Still waiting on a step"
        emphasis={openCases > 0 ? "attention" : "none"}
      />
    </SimpleGrid>
  );
};
