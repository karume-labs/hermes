"use client";

import {
  Alert,
  Card,
  Group,
  Progress,
  SimpleGrid,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import type { ReactNode } from "react";
import { useCareMetrics } from "@/features/admin/services/queries";

const Stat = ({
  label,
  value,
  hint,
  color,
}: {
  label: string;
  value: string | number;
  hint: string;
  color?: string;
}): ReactNode => (
  <Card withBorder>
    <Text size="xs" c="dimmed">
      {label}
    </Text>
    <Text size="xl" fw={700} c={color}>
      {value}
    </Text>
    <Text size="xs" c="dimmed">
      {hint}
    </Text>
  </Card>
);

const pctLabel = (value: number): string => `${value}%`;

export const MetricsView = (): ReactNode => {
  const metrics = useCareMetrics();
  if (metrics.isLoading) return <Text>Loading metrics…</Text>;
  if (metrics.isError || metrics.data === undefined)
    return (
      <Alert color="red" title="Metrics unavailable">
        Start the API with <code>bun run dev:api</code> and reload.
      </Alert>
    );
  const m = metrics.data;
  const breachColor = m.slaBreachPct > 10 ? "red.7" : undefined;

  return (
    <Stack gap="lg">
      <div>
        <Title order={1}>Governance &amp; Performance</Title>
        <Text c="dimmed" size="sm">
          Acknowledgment speed, loop closure, engagement and SLA compliance
          across the ecosystem.
        </Text>
      </div>

      <SimpleGrid cols={{ base: 2, sm: 3, lg: 4 }}>
        <Stat
          label="Avg time to mobile ack"
          value={`${m.avgAckHours}h`}
          hint={`${m.mobileAckPct}% of cases acknowledged`}
        />
        <Stat
          label="Pending mobile ack"
          value={m.pendingAcknowledgement}
          hint="Notified or escalated without a patient tap"
          color={m.pendingAcknowledgement > 0 ? "orange.7" : undefined}
        />
        <Stat
          label="SLA breach rate"
          value={pctLabel(m.slaBreachPct)}
          hint={`${m.slaBreaches} of ${m.total} cases breached`}
          color={breachColor}
        />
        <Stat
          label="Referral conversion"
          value={pctLabel(m.referralConversionPct)}
          hint={`${m.referrals} cases referred onward`}
        />
        <Stat
          label="Push read rate"
          value={pctLabel(m.pushReadPct)}
          hint="Read of pushes that reached a device"
        />
        <Stat
          label="7-day retention"
          value={pctLabel(m.retention7dPct)}
          hint={`${m.activePatients7d} active patients · ${m.appOpens7d} opens`}
        />
        <Stat
          label="Closed cases"
          value={m.closed}
          hint={`${m.total} total · ${m.escalated} escalated`}
        />
        <Stat
          label="Avg time to booking"
          value={`${m.avgTimeToBookingHours}h`}
          hint={`${m.appointments} appointments booked`}
        />
      </SimpleGrid>

      <Card withBorder>
        <Group justify="space-between" mb="sm">
          <Text fw={600}>Acknowledgment speed by severity</Text>
          <Text size="xs" c="dimmed">
            Target: Urgent &lt; 4h · Actionable &lt; 24h · Routine &lt; 72h
          </Text>
        </Group>
        <SimpleGrid cols={{ base: 1, sm: 3 }}>
          {(
            [
              ["Routine", m.avgAckBySeverity.Routine, "gray"],
              ["Actionable", m.avgAckBySeverity.Actionable, "orange"],
              ["Urgent", m.avgAckBySeverity.Urgent, "red"],
            ] as const
          ).map(([label, hours, color]) => (
            <div key={label}>
              <Text size="sm">
                {label} · {hours}h
              </Text>
              <Progress
                value={Math.min(hours, 72)}
                color={color}
                size="sm"
                mt={4}
              />
            </div>
          ))}
        </SimpleGrid>
      </Card>

      <Card withBorder>
        <Text fw={600} mb="sm">
          Severity mix
        </Text>
        <Stack gap={8}>
          {(
            [
              ["Routine", m.bySeverity.Routine, "gray"],
              ["Actionable", m.bySeverity.Actionable, "orange"],
              ["Urgent", m.bySeverity.Urgent, "red"],
            ] as const
          ).map(([label, value, color]) => (
            <div key={label}>
              <Text size="xs" c="dimmed">
                {label} ({value})
              </Text>
              <Progress
                value={m.total === 0 ? 0 : (value / m.total) * 100}
                color={color}
              />
            </div>
          ))}
        </Stack>
      </Card>
    </Stack>
  );
};
