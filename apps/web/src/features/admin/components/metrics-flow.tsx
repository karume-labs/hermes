"use client";

import { SimpleGrid, Stack } from "@mantine/core";
import {
  IconCalendarStats,
  IconCircleCheck,
  IconClockHour4,
  IconFileCheck,
  IconStethoscope,
  IconTimeline,
} from "@tabler/icons-react";
import type { ReactNode } from "react";
import type { Metrics } from "@/features/admin/components/metrics-types";
import { MetricCard } from "@/features/shared/components/ui/metric-card";
import { SectionHeader } from "@/features/shared/components/ui/section-header";

export const MetricsFlow = ({ m }: { m: Metrics }): ReactNode => (
  <Stack gap="md">
    <SectionHeader
      icon={<IconTimeline size={19} />}
      title="Care flow"
      hint="Hours from result to each step of the pathway"
      tone="routine"
    />
    <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }}>
      <MetricCard
        label="Time to booking"
        value={m.avgTimeToBookingHours}
        unit="h"
        icon={<IconCalendarStats size={18} />}
        tone="routine"
        hint={`${m.appointments} appointments booked`}
      />
      <MetricCard
        label="Time to confirmation"
        value={m.avgTimeToConfirmationHours}
        unit="h"
        icon={<IconFileCheck size={18} />}
        hint="Result received to confirmatory test"
      />
      <MetricCard
        label="Time to consultation"
        value={m.avgTimeToConsultationHours}
        unit="h"
        icon={<IconStethoscope size={18} />}
        hint="Result received to clinical review"
      />
      <MetricCard
        label="Time to treatment"
        value={m.avgTimeToTreatmentHours}
        unit="h"
        icon={<IconCircleCheck size={18} />}
        tone="routine"
        hint="Result received to treatment start"
      />
      <MetricCard
        label="Time to closure"
        value={m.avgTimeToClosureHours}
        unit="h"
        icon={<IconClockHour4 size={18} />}
        hint="Result received to a closed case"
      />
    </SimpleGrid>
  </Stack>
);
