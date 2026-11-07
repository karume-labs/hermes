"use client";

import type { CaseDetail } from "@hermes/types";
import { Badge, Card, Group, Text } from "@mantine/core";
import type { ReactNode } from "react";

const statusColor = (status: string): string => {
  if (status === "declined") return "red";
  if (status === "completed") return "teal";
  if (status === "accepted") return "blue";
  return "orange";
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
      <Badge color={statusColor(referral.status)} variant="light">
        {referral.status}
      </Badge>
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
