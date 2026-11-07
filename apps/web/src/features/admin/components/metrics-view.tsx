"use client";

import { Alert, SimpleGrid, Stack, Text } from "@mantine/core";
import type { ReactNode } from "react";
import { DelayReasonsCard } from "@/features/admin/components/metrics-delays";
import { SeveritySection } from "@/features/admin/components/metrics-severity";
import { useCareMetrics } from "@/features/admin/services/queries";
import { PageHeader } from "@/features/shared/components/layout/page-header";
import { MetricCard } from "@/features/shared/components/ui/metric-card";

const pctLabel = (value: number): string => `${value}%`;

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
          label="Time to closure"
          value={`${m.avgTimeToClosureHours}h`}
          hint="Result received to a closed case"
        />
        <MetricCard
          label="Unassigned open cases"
          value={m.unassignedOpen}
          hint="Open cases without a named owner"
          tone={m.unassignedOpen > 0 ? "orange.7" : "brandSlate.9"}
        />
        <MetricCard
          label="Referrals pending"
          value={m.referralsPending}
          hint="Sent and awaiting the receiving clinic"
          tone={m.referralsPending > 0 ? "orange.7" : "brandSlate.9"}
        />
        <MetricCard
          label="Referrals declined"
          value={m.referralsDeclined}
          hint="Declined and returned with a re-route task"
          tone={m.referralsDeclined > 0 ? "red.7" : "brandSlate.9"}
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

      <DelayReasonsCard delayReasons={m.delayReasons} />
      <SeveritySection
        ackBySeverity={m.avgAckBySeverity}
        mix={m.bySeverity}
        total={m.total}
      />
    </Stack>
  );
};
