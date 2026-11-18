"use client";

import {
  Alert,
  Card,
  SegmentedControl,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { IconAdjustmentsAlt } from "@tabler/icons-react";
import type { ReactNode } from "react";
import { useUpdateOwnPreferences } from "@/features/admin/services/organization-mutations";
import { PageHeader } from "@/features/shared/components/layout/page-header";
import { useNotificationPreferences } from "@/features/staff/services/queries";

const CHANNELS = [
  { value: "in_app", label: "In-app only" },
  { value: "email", label: "Email" },
  { value: "both", label: "In-app + email" },
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

      <Card
        radius="lg"
        p="lg"
        bg="var(--hermes-surface)"
        bd="1px solid var(--hermes-line)"
      >
        <Stack gap="md">
          <Title order={3} size="h5">
            Notifications
          </Title>
          <Text size="sm" c="dimmed">
            In-app alerts always appear in Hermes. Choose Email or In-app +
            email when the same message should also reach your inbox.
          </Text>
          <SegmentedControl
            value={current}
            onChange={save}
            data={CHANNELS}
            disabled={preferences.isLoading || update.isPending}
          />
          {update.isError ? (
            <Text size="sm" c="red">
              Could not save that choice. Try again.
            </Text>
          ) : null}
          {update.isSuccess ? (
            <Text size="sm" c="teal">
              Saved.
            </Text>
          ) : null}
        </Stack>
      </Card>
    </Stack>
  );
};
