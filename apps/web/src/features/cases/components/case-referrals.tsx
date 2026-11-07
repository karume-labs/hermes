"use client";

import type { CaseDetail } from "@hermes/types";
import {
  Alert,
  Button,
  Card,
  Group,
  Stack,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import type { ReactNode } from "react";
import { useState } from "react";
import { authClient } from "@/features/auth/services/client";
import { ReferralHistoryItem } from "@/features/cases/components/referral-history-item";
import { useReferralDecision } from "@/features/cases/services/mutations-referral";
import { errorMessage } from "@/features/shared/utils/form-errors";

export const CaseReferrals = ({
  detail,
}: {
  detail: CaseDetail;
}): ReactNode => {
  const session = authClient.useSession();
  const decide = useReferralDecision();
  const [reason, setReason] = useState("");
  const staff = session.data?.user;

  if (detail.referrals.length === 0) {
    return (
      <Card withBorder radius="md" p="lg">
        <Title order={3}>Referral history</Title>
        <Text size="sm" c="dimmed">
          No referrals have been sent for this case.
        </Text>
      </Card>
    );
  }

  return (
    <Card withBorder radius="md" p="lg">
      <Title order={3} mb="sm">
        Referral history
      </Title>
      {decide.isError ? (
        <Alert color="red" mb="sm">
          {errorMessage(decide.error)}
        </Alert>
      ) : null}
      <Stack gap="md">
        {detail.referrals.map((referral) => {
          const canDecide =
            referral.status === "sent" &&
            (staff?.role === "admin" ||
              staff?.clinicId === referral.toClinicId);
          return (
            <ReferralHistoryItem key={referral.id} referral={referral}>
              {canDecide ? (
                <Stack gap="xs" mt="sm">
                  <TextInput
                    size="xs"
                    label="Decline reason"
                    value={reason}
                    onChange={(event) => setReason(event.currentTarget.value)}
                  />
                  <Group gap="xs">
                    <Button
                      size="xs"
                      loading={decide.isPending}
                      onClick={() =>
                        decide.mutate({
                          referralId: referral.id,
                          action: "accept",
                          assignedToId:
                            staff?.role === "admin" ? undefined : staff?.id,
                        })
                      }
                    >
                      Accept referral
                    </Button>
                    <Button
                      size="xs"
                      variant="light"
                      color="red"
                      loading={decide.isPending}
                      disabled={reason.trim().length < 3}
                      onClick={() =>
                        decide.mutate({
                          referralId: referral.id,
                          action: "decline",
                          reason,
                        })
                      }
                    >
                      Decline
                    </Button>
                  </Group>
                </Stack>
              ) : null}
              {referral.status === "accepted" &&
              (staff?.role === "admin" ||
                staff?.clinicId === referral.toClinicId) ? (
                <Button
                  size="xs"
                  variant="light"
                  mt="sm"
                  loading={decide.isPending}
                  onClick={() =>
                    decide.mutate({
                      referralId: referral.id,
                      action: "complete",
                    })
                  }
                >
                  Mark referral completed
                </Button>
              ) : null}
            </ReferralHistoryItem>
          );
        })}
      </Stack>
    </Card>
  );
};
