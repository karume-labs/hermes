"use client";

import type { NotificationPreference } from "@hermes/types";
import { Card, SimpleGrid, Stack, Text } from "@mantine/core";
import {
  IconBellRinging,
  IconDeviceMobile,
  IconMail,
  IconStack2,
} from "@tabler/icons-react";
import type { ReactNode } from "react";
import { useUpdateOwnPreferences } from "@/features/admin/services/organization-mutations";
import { authClient } from "@/features/auth/services/client";
import { ChannelCard } from "@/features/shared/components/ui/channel-card";
import { SectionHeader } from "@/features/shared/components/ui/section-header";

const CHANNELS = [
  {
    value: "in_app" as const,
    title: "In-app only",
    description: "Hand-overs and invitations stay in the dashboard.",
    icon: <IconDeviceMobile size={19} />,
  },
  {
    value: "email" as const,
    title: "Email only",
    description: "Every hand-over lands in your work inbox.",
    icon: <IconMail size={19} />,
  },
  {
    value: "both" as const,
    title: "Both",
    description: "Dashboard alert plus an email copy.",
    icon: <IconStack2 size={19} />,
  },
];

const channelOf = (value: unknown): NotificationPreference =>
  value === "email" || value === "in_app" || value === "both" ? value : "both";

export const OrgAlertPreferencesCard = (): ReactNode => {
  const session = authClient.useSession();
  const preferences = useUpdateOwnPreferences();
  const isOrgAdmin = session.data?.user.role === "org_admin";
  const current = channelOf(session.data?.user.notificationChannel);

  return (
    <Card p="lg" bg="var(--hermes-surface)" bd="1px solid var(--hermes-line)">
      <Stack gap="lg">
        <SectionHeader
          icon={<IconBellRinging size={19} />}
          title="Your alerts"
          hint="Hand-overs and invitations can reach you by email, in the dashboard, or both"
          tone="info"
        />

        <SimpleGrid cols={{ base: 1, md: 3 }}>
          {CHANNELS.map((channel) => (
            <ChannelCard
              key={channel.value}
              icon={channel.icon}
              title={channel.title}
              description={channel.description}
              checked={current === channel.value}
              disabled={preferences.isPending}
              onSelect={() => preferences.mutate({ channel: channel.value })}
            />
          ))}
        </SimpleGrid>

        {isOrgAdmin ? (
          <Text size="xs" c="var(--hermes-ink-muted)">
            Organization admins manage their own team; platform administrators
            manage organizations.
          </Text>
        ) : null}
      </Stack>
    </Card>
  );
};
