"use client";

import { Alert, Stack, Text } from "@mantine/core";
import { IconCalendarStats } from "@tabler/icons-react";
import type { ReactNode } from "react";
import { DelayReasonsCard } from "@/features/admin/components/metrics-delays";
import { MetricsEngagement } from "@/features/admin/components/metrics-engagement";
import { MetricsFlow } from "@/features/admin/components/metrics-flow";
import { MetricsNetwork } from "@/features/admin/components/metrics-network";
import { MetricsRisk } from "@/features/admin/components/metrics-risk";
import { SeveritySection } from "@/features/admin/components/metrics-severity";
import { useCareMetrics } from "@/features/admin/services/queries";
import { PageHeader } from "@/features/shared/components/layout/page-header";

export const MetricsView = (): ReactNode => {
  const metrics = useCareMetrics();

  if (metrics.isLoading) return <Text c="dimmed">Loading metrics…</Text>;
  if (metrics.isError || metrics.data === undefined)
    return (
      <Alert color="red" title="Metrics unavailable">
        Start the API with <code>bun run dev:api</code> and reload.
      </Alert>
    );

  const m = metrics.data;

  return (
    <Stack gap="xl">
      <PageHeader
        eyebrow="Administration"
        title="Governance & performance"
        subtitle="How fast patients respond, how many results close on time, and where the delays sit."
        icon={<IconCalendarStats size={24} />}
        tone="info"
      />

      <MetricsEngagement m={m} />
      <MetricsRisk m={m} />
      <MetricsFlow m={m} />
      <MetricsNetwork m={m} />

      <DelayReasonsCard delayReasons={m.delayReasons} />
      <SeveritySection
        ackBySeverity={m.avgAckBySeverity}
        mix={m.bySeverity}
        total={m.total}
      />
    </Stack>
  );
};
