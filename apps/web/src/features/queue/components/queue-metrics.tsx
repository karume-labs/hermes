"use client";

import { SimpleGrid } from "@mantine/core";
import type { ReactNode } from "react";
import { MetricCard } from "@/features/shared/components/ui/metric-card";

export const QueueMetrics = ({
  total,
  pending,
  breached,
  unassigned,
}: {
  total: number;
  pending: number;
  breached: number;
  unassigned: number;
}): ReactNode => (
  <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }}>
    <MetricCard
      label="In view"
      value={total}
      hint="Results matching the filters above"
    />
    <MetricCard
      label="Waiting on the patient"
      value={pending}
      hint="Messaged, no confirmation yet"
      emphasis={pending > 0 ? "attention" : "none"}
    />
    <MetricCard
      label="Past the deadline"
      value={breached}
      hint="No confirmation and the window closed"
      emphasis={breached > 0 ? "alert" : "none"}
    />
    <MetricCard
      label="No owner"
      value={unassigned}
      hint="Nobody has picked these up"
      emphasis={unassigned > 0 ? "attention" : "none"}
    />
  </SimpleGrid>
);
