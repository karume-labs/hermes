"use client";

import { SimpleGrid, Stack } from "@mantine/core";
import {
  IconArrowsExchange,
  IconCircleCheck,
  IconFileCheck,
} from "@tabler/icons-react";
import type { ReactNode } from "react";
import type { Metrics } from "@/features/admin/components/metrics-types";
import { MetricCard } from "@/features/shared/components/ui/metric-card";
import { SectionHeader } from "@/features/shared/components/ui/section-header";

export const MetricsNetwork = ({ m }: { m: Metrics }): ReactNode => (
  <Stack gap="md">
    <SectionHeader
      icon={<IconArrowsExchange size={19} />}
      title="Network & closure"
      hint="Hand-offs between clinics and how cases end"
      tone="info"
    />
    <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }}>
      <MetricCard
        label="Referrals pending"
        value={m.referralsPending}
        icon={<IconArrowsExchange size={18} />}
        tone={m.referralsPending > 0 ? "actionable" : "routine"}
        hint="Sent and awaiting the receiving clinic"
        emphasis={m.referralsPending > 0 ? "attention" : "none"}
      />
      <MetricCard
        label="Referral acceptance"
        value={m.referralAcceptancePct}
        unit="%"
        icon={<IconFileCheck size={18} />}
        tone="routine"
        hint={`${m.referralsAccepted} accepted · ${m.referralsCompleted} completed`}
      />
      <MetricCard
        label="Closed cases"
        value={m.closed}
        icon={<IconCircleCheck size={18} />}
        tone="routine"
        hint={`${m.total} total · ${m.escalated} escalated`}
      />
      <MetricCard
        label="Documented closure"
        value={m.documentedClosurePct}
        unit="%"
        icon={<IconFileCheck size={18} />}
        tone={m.documentedClosurePct < 90 ? "actionable" : "routine"}
        hint="Closed with evidence and a follow-up plan"
      />
    </SimpleGrid>
  </Stack>
);
