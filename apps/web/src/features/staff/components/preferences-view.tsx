"use client";

import { Alert, Card, Group, SimpleGrid, Stack, Text } from "@mantine/core";
import {
  IconAdjustmentsAlt,
  IconBellRinging,
  IconDeviceMobile,
  IconMail,
  IconStack2,
} from "@tabler/icons-react";
import type { ReactNode } from "react";
import { useUpdateOwnPreferences } from "@/features/admin/services/organization-mutations";
import { PageHeader } from "@/features/shared/components/layout/page-header";
import { ChannelCard } from "@/features/shared/components/ui/channel-card";
import { Pill } from "@/features/shared/components/ui/pill";
import { SectionHeader } from "@/features/shared/components/ui/section-header";
import { useNotificationPreferences } from "@/features/staff/services/queries";

const CHANNELS = [
  {
    value: "in_app",
    title: "In-app only",
    description: "Alerts stay inside Hermes. Nothing reaches your inbox.",
    icon: <IconDeviceMobile size={19} />,
  },
  {
    value: "email",
    title: "Email",
    description: "The same alert also lands in your work inbox.",
    icon: <IconMail size={19} />,
  },
  {
    value: "both",
    title: "In-app + email",
    description: "A Hermes alert and a copy by email, for both channels.",
    icon: <IconStack2 size={19} />,
  },
];

export const PreferencesView = (): ReactNode => {
  const preferences = useNotificationPreferences();
  const update = useUpdateOwnPreferences();
  const current =
    preferences.data === undefined ? "in_app" : preferences.data.channel;

  const save = (next: string): void => {
    if (next === "email" || next === "in_app" || next === "both") {
      update.mutate({ channel: next });
    }
  };

  return (
    <Stack gap="xl">
      <PageHeader
        eyebrow="Account"
        title="Preferences"
        subtitle="Choose how Hermes reaches you about results, reviews and visits."
        icon={<IconAdjustmentsAlt size={24} />}
      />

      {preferences.isError ? (
        <Alert color="red" title="Preferences could not load">
          Refresh the page or sign in again.
        </Alert>
      ) : null}

      <Card p="xl" bg="var(--hermes-surface)" bd="1px solid var(--hermes-line)">
        <Stack gap="lg">
          <SectionHeader
            icon={<IconBellRinging size={19} />}
            title="Notifications"
            hint="In-app alerts always appear in Hermes; email adds a copy"
            tone="info"
            action={
              update.isSuccess ? (
                <Pill tone="routine" size="sm">
                  Saved
                </Pill>
              ) : null
            }
          />

          <SimpleGrid cols={{ base: 1, md: 3 }}>
            {CHANNELS.map((channel) => (
              <ChannelCard
                key={channel.value}
                icon={channel.icon}
                title={channel.title}
                description={channel.description}
                checked={current === channel.value}
                disabled={preferences.isLoading || update.isPending}
                onSelect={() => save(channel.value)}
              />
            ))}
          </SimpleGrid>

          {update.isError ? (
            <Group gap="xs">
              <Pill tone="urgent" size="sm">
                Not saved
              </Pill>
              <Text size="sm" c="var(--hermes-ink-muted)">
                Could not save that choice. Try again.
              </Text>
            </Group>
          ) : null}
        </Stack>
      </Card>
    </Stack>
  );
};
