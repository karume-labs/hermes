"use client";

import { SimpleGrid } from "@mantine/core";
import type { ReactNode } from "react";
import { MetricCard } from "@/features/shared/components/ui/metric-card";

interface TaskMetricsProps {
  total: number;
  overdue: number;
  reviews: number;
  followUps: number;
  status: string;
}

export const TaskMetrics = ({
  total,
  overdue,
  reviews,
  followUps,
  status,
}: TaskMetricsProps): ReactNode => (
  <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }}>
    <MetricCard
      label="In view"
      value={total}
      hint={status === "open" ? "Still waiting" : "Completed"}
    />
    <MetricCard
      label="Late"
      value={overdue}
      hint="Past the due date"
      emphasis={overdue > 0 ? "alert" : "none"}
    />
    <MetricCard
      label="Reviews"
      value={reviews}
      hint="Scheduled result reviews"
    />
    <MetricCard
      label="Asked for help"
      value={followUps}
      hint="Patients who said they need a hand"
      emphasis={followUps > 0 ? "attention" : "none"}
    />
  </SimpleGrid>
);
