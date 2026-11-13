"use client";

import type { CaseDetail } from "@hermes/types";
import { Alert, Card, Stack, Text, Title } from "@mantine/core";
import type { ReactNode } from "react";
import { CaseAppointmentCard } from "@/features/cases/components/case-appointment-card";
import { CaseAssignment } from "@/features/cases/components/case-assignment";
import { CaseMilestones } from "@/features/cases/components/case-milestones";
import { CaseOpenWorkCard } from "@/features/cases/components/case-open-work-card";
import { CaseReferrals } from "@/features/cases/components/case-referrals";
import { CaseCloseForm } from "@/features/cases/components/close-case-form";
import { CaseReferralForm } from "@/features/cases/components/referral-form";

export const CaseActions = ({ detail }: { detail: CaseDetail }): ReactNode => {
  const closed = detail.status === "closed";

  return (
    <Stack gap="lg">
      <CaseAppointmentCard detail={detail} />

      <CaseAssignment detail={detail} />

      <CaseMilestones detail={detail} />

      <Card withBorder radius="md" p="lg">
        <Title order={3}>Referral hand-off</Title>
        <Text size="sm" c="dimmed" mb="sm">
          Link the downstream provider so the shared record follows the patient.
        </Text>
        <CaseReferralForm
          caseId={detail.id}
          currentClinicId={detail.referralClinicId}
          originClinicId={detail.clinicId}
          disabled={closed}
        />
      </Card>

      <CaseReferrals detail={detail} />

      <CaseOpenWorkCard detail={detail} />

      <Card withBorder radius="md" p="lg">
        <Title order={3}>Documented closure</Title>
        <Text size="sm" c="dimmed" mb="sm">
          Clinical sign-off needs evidence and a follow-up plan.
        </Text>
        {closed ? (
          <Alert color="teal" mb="sm" title="Closed">
            {detail.closureEvidence} · Plan: {detail.closurePlan} · Signed by{" "}
            {detail.closedBy}
          </Alert>
        ) : null}
        <CaseCloseForm caseId={detail.id} disabled={closed} />
      </Card>
    </Stack>
  );
};
