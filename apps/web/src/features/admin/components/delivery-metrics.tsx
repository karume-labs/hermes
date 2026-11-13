"use client";

import { Alert, SimpleGrid } from "@mantine/core";
import type { ReactNode } from "react";
import { MetricCard } from "@/features/shared/components/ui/metric-card";

interface DeliveryMetricsProps {
  queued: number;
  sent: number;
  read: number;
  failed: number;
  smsQueued: number;
  failureCount: number;
  failureMessage: string | null;
}

export const DeliveryMetrics = ({
  queued,
  sent,
  read,
  failed,
  smsQueued,
  failureCount,
  failureMessage,
}: DeliveryMetricsProps): ReactNode => (
  <>
    <SimpleGrid cols={{ base: 1, sm: 2, lg: 5 }}>
      <MetricCard label="Queued" value={queued} />
      <MetricCard label="Sent" value={sent} />
      <MetricCard label="Read" value={read} />
      <MetricCard
        label="Failed"
        value={failed}
        emphasis={failed > 0 ? "alert" : "none"}
      />
      <MetricCard label="SMS fallback" value={smsQueued} />
    </SimpleGrid>

    {failureCount > 0 ? (
      <Alert color="orange" title={`${failureCount} failed deliveries`}>
        {failureMessage === null
          ? "Inspect the failed rows in the outbox table."
          : failureMessage}
      </Alert>
    ) : null}
  </>
);
