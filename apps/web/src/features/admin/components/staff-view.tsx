"use client";

import { Alert, Badge, Button, Card, Group, Stack, Text } from "@mantine/core";
import type { ReactNode } from "react";
import { StaffInviteCard } from "@/features/admin/components/staff-invite-card";
import { StaffUsersTable } from "@/features/admin/components/staff-users-table";
import {
  useRevokeStaffInvite,
  useUpdateStaffUser,
} from "@/features/admin/services/mutations";
import { useStaffInvites } from "@/features/admin/services/queries";
import { PageHeader } from "@/features/shared/components/layout/page-header";
import { errorMessage } from "@/features/shared/utils/form-errors";

const formatDay = (value: string): string =>
  new Date(value).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

export const StaffView = (): ReactNode => {
  const invites = useStaffInvites();
  const revoke = useRevokeStaffInvite();
  const update = useUpdateStaffUser();
  const pending = invites.data ?? [];

  return (
    <Stack gap="xl">
      <PageHeader
        eyebrow="Administration"
        title="Staff access"
        subtitle="Invite coordinators, assign them to a clinic, and revoke access when someone leaves."
      />

      {invites.isError || revoke.isError || update.isError ? (
        <Alert color="red" title="Staff access update failed">
          {errorMessage(
            invites.isError
              ? invites.error
              : revoke.isError
                ? revoke.error
                : update.error,
          )}
        </Alert>
      ) : null}

      <StaffInviteCard />

      <Card
        radius="sm"
        p="lg"
        bg="var(--hermes-surface)"
        bd="1px solid var(--hermes-line)"
      >
        <Text fw={700} mb="md">
          Staff accounts
        </Text>
        <StaffUsersTable />
      </Card>

      <Card
        radius="sm"
        p="lg"
        bg="var(--hermes-surface)"
        bd="1px solid var(--hermes-line)"
      >
        <Text fw={700} mb="md">
          Pending invites
        </Text>
        {pending.length === 0 ? (
          <Text size="sm" c="dimmed">
            No invites waiting to be accepted.
          </Text>
        ) : (
          <Stack gap="sm">
            {pending.map((invite) => (
              <Group key={invite.id} justify="space-between" wrap="nowrap">
                <Stack gap={0}>
                  <Text size="sm" fw={600}>
                    {invite.name} · {invite.email}
                  </Text>
                  <Text size="xs" c="dimmed">
                    {invite.role} · expires {formatDay(invite.expiresAt)}
                  </Text>
                </Stack>
                <Group gap="xs" wrap="nowrap">
                  <Badge variant="light">
                    {invite.clinicId ?? "All clinics"}
                  </Badge>
                  <Button
                    size="compact-xs"
                    variant="subtle"
                    color="red"
                    loading={revoke.isPending}
                    onClick={() => revoke.mutate(invite.id)}
                  >
                    Revoke
                  </Button>
                </Group>
              </Group>
            ))}
          </Stack>
        )}
      </Card>
    </Stack>
  );
};
