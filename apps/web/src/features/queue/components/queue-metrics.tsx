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
      hint="Cases matching the current filters"
    />
    <MetricCard
      label="Pending ack"
      value={pending}
      hint="Notified or escalated without a patient tap"
      tone={pending > 0 ? "orange.7" : "brandSlate.9"}
    />
    <MetricCard
      label="SLA breached"
      value={breached}
      hint="Past due with no acknowledgment"
      tone={breached > 0 ? "red.7" : "brandSlate.9"}
    />
    <MetricCard
      label="Unassigned"
      value={unassigned}
      hint="No named owner yet"
      tone={unassigned > 0 ? "orange.7" : "brandSlate.9"}
    />
  </SimpleGrid>
);
