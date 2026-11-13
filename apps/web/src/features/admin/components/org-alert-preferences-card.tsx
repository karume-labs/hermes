"use client";

import type { NotificationPreference } from "@hermes/types";
import { Card, Select, Text, Title } from "@mantine/core";
import type { ReactNode } from "react";
import { useUpdateOwnPreferences } from "@/features/admin/services/organization-mutations";
import { authClient } from "@/features/auth/services/client";

const CHANNELS: { value: NotificationPreference; label: string }[] = [
  { value: "in_app", label: "In app only" },
  { value: "email", label: "Email only" },
  { value: "both", label: "Email and in app" },
];

const channelOf = (value: unknown): NotificationPreference =>
  value === "email" || value === "in_app" || value === "both" ? value : "both";

export const OrgAlertPreferencesCard = (): ReactNode => {
  const session = authClient.useSession();
  const preferences = useUpdateOwnPreferences();
  const isOrgAdmin = session.data?.user.role === "org_admin";

  return (
    <Card radius="sm" p="lg" bd="1px solid var(--hermes-line)">
      <Title order={3} mb={4}>
        Your alerts
      </Title>
      <Text size="sm" c="dimmed" mb="sm">
        Hand-overs and invitations can reach you by email, in the dashboard, or
        both.
      </Text>
      <Select
        w={260}
        data={CHANNELS}
        value={channelOf(session.data?.user.notificationChannel)}
        onChange={(value) =>
          preferences.mutate({
            channel:
              value === "email"
                ? "email"
                : value === "in_app"
                  ? "in_app"
                  : "both",
          })
        }
        allowDeselect={false}
      />
      {isOrgAdmin ? (
        <Text size="xs" c="dimmed" mt="xs">
          Organization admins manage their own team; platform administrators
          manage organizations.
        </Text>
      ) : null}
    </Card>
  );
};
