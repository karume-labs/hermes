"use client";

import { SimpleGrid } from "@mantine/core";
import type { ReactNode } from "react";
import { MetricCard } from "@/features/shared/components/ui/metric-card";

interface AppointmentMetricsProps {
  upcoming: number;
  today: number;
  attended: number;
  cancelled: number;
  hasNoShow: boolean;
}

export const AppointmentMetrics = ({
  upcoming,
  today,
  attended,
  cancelled,
  hasNoShow,
}: AppointmentMetricsProps): ReactNode => (
  <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }}>
    <MetricCard
      label="Coming up"
      value={upcoming}
      hint="Confirmed visits ahead"
    />
    <MetricCard label="Today" value={today} hint="On today's list" />
    <MetricCard label="Attended" value={attended} hint="Visits that happened" />
    <MetricCard
      label="Cancelled or missed"
      value={cancelled}
      hint="Released slots and no-shows"
      emphasis={hasNoShow ? "attention" : "none"}
    />
  </SimpleGrid>
);
