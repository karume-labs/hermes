"use client";

import type { CaseDetail } from "@hermes/types";
import { Card, Group, Text } from "@mantine/core";
import type { ReactNode } from "react";
import { Pill, type Tone } from "@/features/shared/components/ui/pill";

const toneFor = (status: string): Tone => {
  if (status === "declined") return "urgent";
  if (status === "accepted") return "routine";
  if (status === "completed") return "info";
  return "actionable";
};

export const ReferralHistoryItem = ({
  referral,
  children,
}: {
  referral: CaseDetail["referrals"][number];
  children?: ReactNode;
}): ReactNode => (
  <Card withBorder radius="sm" p="sm">
    <Group justify="space-between" mb={4}>
      <Text size="sm" fw={600}>
        {referral.fromClinicId} → {referral.toClinicId}
      </Text>
      <Pill tone={toneFor(referral.status)}>{referral.status}</Pill>
    </Group>
    <Text size="sm">{referral.note}</Text>
    <Text size="xs" c="dimmed" mt={4}>
      Sent by {referral.sentBy} ·{" "}
      {new Date(referral.createdAt).toLocaleString()}
      {referral.acceptedBy === null
        ? ""
        : ` · accepted by ${referral.acceptedBy}`}
      {referral.declineReason === null
        ? ""
        : ` · declined: ${referral.declineReason}`}
    </Text>
    {children}
  </Card>
);
