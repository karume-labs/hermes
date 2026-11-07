"use client";

import type { CaseDetail } from "@hermes/types";
import { Card, Stack, Text, Title } from "@mantine/core";
import type { ReactNode } from "react";
import { ConfirmationForm } from "@/features/cases/components/milestones/confirmation-form";
import { ConsultationForm } from "@/features/cases/components/milestones/consultation-form";
import { DropOffForm } from "@/features/cases/components/milestones/drop-off-form";
import { SurveillanceForm } from "@/features/cases/components/milestones/surveillance-form";
import { TreatmentForm } from "@/features/cases/components/milestones/treatment-form";

const stamp = (value: string | null, label: string): string =>
  value === null
    ? `${label}: pending`
    : `${label}: ${new Date(value).toLocaleString()}`;

export const CaseMilestones = ({
  detail,
}: {
  detail: CaseDetail;
}): ReactNode => {
  const closed = detail.status === "closed";

  return (
    <Card withBorder radius="md" p="lg">
      <Title order={3}>Clinical milestones</Title>
      <Text size="sm" c="dimmed" mb="sm">
        {stamp(detail.confirmedAt, "Confirmation")} ·{" "}
        {stamp(detail.consultedAt, "Consultation")} ·{" "}
        {stamp(detail.treatmentStartedAt, "Treatment")}
      </Text>
      {detail.confirmationNotes === null ? null : (
        <Text size="sm">Confirmation: {detail.confirmationNotes}</Text>
      )}
      {detail.consultationNotes === null ? null : (
        <Text size="sm">Consultation: {detail.consultationNotes}</Text>
      )}
      {detail.treatmentSummary === null ? null : (
        <Text size="sm">Treatment: {detail.treatmentSummary}</Text>
      )}
      {detail.surveillancePlan === null ? null : (
        <Text size="sm">
          Surveillance: {detail.surveillancePlan} · Next review{" "}
          {detail.nextReviewAt === null
            ? "not set"
            : new Date(detail.nextReviewAt).toLocaleDateString()}
        </Text>
      )}
      {detail.dropOffReason === null ? null : (
        <Text size="sm" c="orange.8">
          Drop-off recorded: {detail.dropOffReason}
        </Text>
      )}

      <Stack gap="md" mt="md">
        <ConfirmationForm caseId={detail.id} closed={closed} />
        <ConsultationForm caseId={detail.id} closed={closed} />
        <TreatmentForm caseId={detail.id} closed={closed} />
        <SurveillanceForm caseId={detail.id} closed={closed} />
        <DropOffForm caseId={detail.id} closed={closed} />
      </Stack>
    </Card>
  );
};
