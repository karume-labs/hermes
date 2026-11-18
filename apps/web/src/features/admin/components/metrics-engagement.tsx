"use client";

import { SimpleGrid, Stack } from "@mantine/core";
import {
  IconBellRinging,
  IconClockHour4,
  IconFileCheck,
  IconHourglassHigh,
  IconRepeat,
  IconSparkles,
} from "@tabler/icons-react";
import type { ReactNode } from "react";
import type { Metrics } from "@/features/admin/components/metrics-types";
import { MetricCard } from "@/features/shared/components/ui/metric-card";
import { SectionHeader } from "@/features/shared/components/ui/section-header";

export const MetricsEngagement = ({ m }: { m: Metrics }): ReactNode => (
  <Stack gap="md">
    <SectionHeader
      icon={<IconBellRinging size={19} />}
      title="Patient engagement"
      hint="Whether the person on the other end actually saw the result"
      tone="info"
    />
    <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }}>
      <MetricCard
        label="Time to mobile ack"
        value={m.avgAckHours}
        unit="h"
        icon={<IconClockHour4 size={18} />}
        tone="info"
        hint={`${m.mobileAckPct}% confirmed by the patient`}
        help="Average hours between notification and the patient opening the result."
      />
      <MetricCard
        label="Pending mobile ack"
        value={m.pendingAcknowledgement}
        icon={<IconHourglassHigh size={18} />}
        tone={m.pendingAcknowledgement > 0 ? "actionable" : "routine"}
        hint="Notified without a patient tap"
        emphasis={m.pendingAcknowledgement > 0 ? "attention" : "none"}
      />
      <MetricCard
        label="Push read rate"
        value={m.pushReadPct}
        unit="%"
        icon={<IconRepeat size={18} />}
        tone="routine"
        hint="Read of pushes that reached a device"
      />
      <MetricCard
        label="7-day retention"
        value={m.retention7dPct}
        unit="%"
        icon={<IconRepeat size={18} />}
        hint={`${m.activePatients7d} active · ${m.appOpens7d} opens`}
      />
      <MetricCard
        label="Patient understanding"
        value={m.patientUnderstandingPct}
        unit="%"
        icon={<IconSparkles size={18} />}
        tone={m.patientUnderstandingPct < 80 ? "actionable" : "routine"}
        hint={`${m.feedbackCount} responses · confidence ${m.avgConfidence}/5`}
        emphasis={m.patientUnderstandingPct < 80 ? "attention" : "none"}
      />
      <MetricCard
        label="Time to notification"
        value={m.avgTimeToNotificationHours}
        unit="h"
        icon={<IconFileCheck size={18} />}
        hint="Result received to patient alert"
      />
    </SimpleGrid>
  </Stack>
);
