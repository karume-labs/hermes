"use client";

import {
  Alert,
  Card,
  Group,
  Progress,
  SimpleGrid,
  Stack,
  Text,
} from "@mantine/core";
import type { ReactNode } from "react";
import { useCareMetrics } from "@/features/admin/services/queries";
import { PageHeader } from "@/features/shared/components/layout/page-header";
import { MetricCard } from "@/features/shared/components/ui/metric-card";

const pctLabel = (value: number): string => `${value}%`;

const SEVERITY_TONE = {
  Routine: "brandSlate.4",
  Actionable: "orange.5",
  Urgent: "red.6",
} as const;

interface SeverityBarProps {
  label: string;
  hours: number;
  tone: string;
  target: string;
}

const SeverityBar = ({
  label,
  hours,
  tone,
  target,
}: SeverityBarProps): ReactNode => (
  <Stack gap={6}>
    <Group justify="space-between">
      <Text size="sm" fw={600}>
        {label}
      </Text>
      <Text size="sm" c="dimmed">
        {hours}h · target {target}
      </Text>
    </Group>
    <Progress
      value={Math.min((hours / 72) * 100, 100)}
      color={tone}
      size="sm"
    />
  </Stack>
);

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
        subtitle="Acknowledgment speed, loop closure, engagement and SLA compliance across the ecosystem."
      />

      <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }}>
        <MetricCard
          label="Time to mobile ack"
          value={`${m.avgAckHours}h`}
          hint={`${m.mobileAckPct}% of cases acknowledged`}
          help="Average hours between notification and the patient opening the result."
        />
        <MetricCard
          label="Pending mobile ack"
          value={m.pendingAcknowledgement}
          hint="Notified or escalated without a patient tap"
          tone={m.pendingAcknowledgement > 0 ? "orange.7" : "brandSlate.9"}
        />
        <MetricCard
          label="SLA breach rate"
          value={pctLabel(m.slaBreachPct)}
          hint={`${m.slaBreaches} of ${m.total} cases breached`}
          tone={m.slaBreachPct > 10 ? "red.7" : "brandSlate.9"}
        />
        <MetricCard
          label="Referral acceptance"
          value={pctLabel(m.referralAcceptancePct)}
          hint={`${m.referralsAccepted} accepted · ${m.referralsCompleted} completed`}
        />
        <MetricCard
          label="Push read rate"
          value={pctLabel(m.pushReadPct)}
          hint="Read of pushes that reached a device"
        />
        <MetricCard
          label="7-day retention"
          value={pctLabel(m.retention7dPct)}
          hint={`${m.activePatients7d} active patients · ${m.appOpens7d} opens`}
        />
        <MetricCard
          label="Closed cases"
          value={m.closed}
          hint={`${m.total} total · ${m.escalated} escalated`}
        />
        <MetricCard
          label="Time to booking"
          value={`${m.avgTimeToBookingHours}h`}
          hint={`${m.appointments} appointments booked`}
        />
        <MetricCard
          label="Time to notification"
          value={`${m.avgTimeToNotificationHours}h`}
          hint="Result received to patient alert"
        />
        <MetricCard
          label="Time to confirmation"
          value={`${m.avgTimeToConfirmationHours}h`}
          hint="Result received to confirmatory test"
        />
        <MetricCard
          label="Time to consultation"
          value={`${m.avgTimeToConsultationHours}h`}
          hint="Result received to clinical review"
        />
        <MetricCard
          label="Time to treatment"
          value={`${m.avgTimeToTreatmentHours}h`}
          hint="Result received to treatment start"
        />
        <MetricCard
          label="Unresolved actionable"
          value={m.unresolvedActionable}
          hint={`${m.overdue} past SLA · ${m.pendingAcknowledgement} awaiting ack`}
          tone={m.unresolvedActionable > 0 ? "orange.7" : "brandSlate.9"}
        />
        <MetricCard
          label="Documented closure"
          value={pctLabel(m.documentedClosurePct)}
          hint="Closed with evidence and a follow-up plan"
        />
        <MetricCard
          label="Patient understanding"
          value={pctLabel(m.patientUnderstandingPct)}
          hint={`${m.feedbackCount} responses · confidence ${m.avgConfidence}/5`}
          tone={m.patientUnderstandingPct < 80 ? "orange.7" : "brandSlate.9"}
        />
      </SimpleGrid>

      <Card
        radius="sm"
        p="xl"
        bg="brandChalk.0"
        bd="1px solid var(--mantine-color-brandChalk-3)"
      >
        <Text size="md" fw={700} mb="sm">
          Delay and drop-off reasons
        </Text>
        {Object.entries(m.delayReasons).length === 0 ? (
          <Text size="sm" c="dimmed">
            No reasons recorded yet.
          </Text>
        ) : (
          <Group gap="lg">
            {Object.entries(m.delayReasons).map(([reason, count]) => (
              <Text size="sm" key={reason}>
                {reason}: {count}
              </Text>
            ))}
          </Group>
        )}
      </Card>

      <SimpleGrid cols={{ base: 1, lg: 2 }}>
        <Card
          radius="sm"
          p="xl"
          bg="brandChalk.0"
          bd="1px solid var(--mantine-color-brandChalk-3)"
        >
          <Text size="md" fw={700} mb="lg">
            Acknowledgment speed by severity
          </Text>
          <Stack gap="lg">
            <SeverityBar
              label="Routine"
              hours={m.avgAckBySeverity.Routine}
              tone={SEVERITY_TONE.Routine}
              target="< 72h"
            />
            <SeverityBar
              label="Actionable"
              hours={m.avgAckBySeverity.Actionable}
              tone={SEVERITY_TONE.Actionable}
              target="< 24h"
            />
            <SeverityBar
              label="Urgent"
              hours={m.avgAckBySeverity.Urgent}
              tone={SEVERITY_TONE.Urgent}
              target="< 4h"
            />
          </Stack>
        </Card>

        <Card
          radius="sm"
          p="xl"
          bg="brandChalk.0"
          bd="1px solid var(--mantine-color-brandChalk-3)"
        >
          <Text size="md" fw={700} mb="lg">
            Severity mix
          </Text>
          <Stack gap="lg">
            {(
              [
                ["Routine", m.bySeverity.Routine],
                ["Actionable", m.bySeverity.Actionable],
                ["Urgent", m.bySeverity.Urgent],
              ] as const
            ).map(([label, value]) => (
              <Stack gap={6} key={label}>
                <Group justify="space-between">
                  <Text size="sm" fw={600}>
                    {label}
                  </Text>
                  <Text size="sm" c="dimmed">
                    {value} ·{" "}
                    {m.total === 0 ? 0 : Math.round((value / m.total) * 100)}%
                  </Text>
                </Group>
                <Progress
                  value={m.total === 0 ? 0 : (value / m.total) * 100}
                  color={SEVERITY_TONE[label]}
                  size="sm"
                />
              </Stack>
            ))}
          </Stack>
        </Card>
      </SimpleGrid>
    </Stack>
  );
};
