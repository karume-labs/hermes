"use client";

import { SimpleGrid, Stack } from "@mantine/core";
import {
  IconAlertTriangle,
  IconHourglassHigh,
  IconRouteAltLeft,
  IconUserOff,
} from "@tabler/icons-react";
import type { ReactNode } from "react";
import type { Metrics } from "@/features/admin/components/metrics-types";
import { MetricCard } from "@/features/shared/components/ui/metric-card";
import { SectionHeader } from "@/features/shared/components/ui/section-header";

export const MetricsRisk = ({ m }: { m: Metrics }): ReactNode => (
  <Stack gap="md">
    <SectionHeader
      icon={<IconAlertTriangle size={19} />}
      title="Deadlines & risk"
      hint="Results that slipped their window or lost an owner"
      tone="actionable"
    />
    <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }}>
      <MetricCard
        label="Missed deadlines"
        value={m.slaBreachPct}
        unit="%"
        icon={<IconAlertTriangle size={18} />}
        tone={m.slaBreachPct > 10 ? "urgent" : "routine"}
        hint={`${m.slaBreaches} of ${m.total} cases breached`}
        emphasis={m.slaBreachPct > 10 ? "alert" : "none"}
      />
      <MetricCard
        label="Unresolved actionable"
        value={m.unresolvedActionable}
        icon={<IconHourglassHigh size={18} />}
        tone={m.unresolvedActionable > 0 ? "actionable" : "routine"}
        hint={`${m.overdue} overdue · ${m.pendingAcknowledgement} with the patient`}
        emphasis={m.unresolvedActionable > 0 ? "attention" : "none"}
      />
      <MetricCard
        label="Unassigned open cases"
        value={m.unassignedOpen}
        icon={<IconUserOff size={18} />}
        tone={m.unassignedOpen > 0 ? "actionable" : "routine"}
        hint="Open cases without a named owner"
        emphasis={m.unassignedOpen > 0 ? "attention" : "none"}
      />
      <MetricCard
        label="Referrals declined"
        value={m.referralsDeclined}
        icon={<IconRouteAltLeft size={18} />}
        tone={m.referralsDeclined > 0 ? "urgent" : "routine"}
        hint="Returned with a re-route task"
        emphasis={m.referralsDeclined > 0 ? "alert" : "none"}
      />
    </SimpleGrid>
  </Stack>
);
