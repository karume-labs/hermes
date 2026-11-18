"use client";

import { SimpleGrid } from "@mantine/core";
import {
  IconAlertTriangle,
  IconListDetails,
  IconMessageDots,
  IconUserOff,
} from "@tabler/icons-react";
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
      icon={<IconListDetails size={18} />}
      hint="Results matching the filters above"
    />
    <MetricCard
      label="Waiting on the patient"
      value={pending}
      icon={<IconMessageDots size={18} />}
      tone={pending > 0 ? "actionable" : "routine"}
      hint="Messaged, no confirmation yet"
      emphasis={pending > 0 ? "attention" : "none"}
    />
    <MetricCard
      label="Past the deadline"
      value={breached}
      icon={<IconAlertTriangle size={18} />}
      tone={breached > 0 ? "urgent" : "routine"}
      hint="No confirmation and the window closed"
      emphasis={breached > 0 ? "alert" : "none"}
    />
    <MetricCard
      label="No owner"
      value={unassigned}
      icon={<IconUserOff size={18} />}
      tone={unassigned > 0 ? "actionable" : "routine"}
      hint="Nobody has picked these up"
      emphasis={unassigned > 0 ? "attention" : "none"}
    />
  </SimpleGrid>
);
