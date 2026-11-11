"use client";

import type { NotificationPreference } from "@hermes/types";
import {
  Alert,
  Badge,
  Button,
  Card,
  Group,
  Select,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { type ReactNode, useState } from "react";
import { StaffInviteCard } from "@/features/admin/components/staff-invite-card";
import { StaffUsersTable } from "@/features/admin/components/staff-users-table";
import {
  useCreateOrgClinic,
  useUpdateOrgClinic,
  useUpdateOwnPreferences,
} from "@/features/admin/services/organization-mutations";
import {
  useMyOrganization,
  useOrganizationClinics,
} from "@/features/admin/services/organization-queries";
import { authClient } from "@/features/auth/services/client";
import { PageHeader } from "@/features/shared/components/layout/page-header";
import { errorMessage } from "@/features/shared/utils/form-errors";

const CHANNELS: { value: NotificationPreference; label: string }[] = [
  { value: "in_app", label: "In app only" },
  { value: "email", label: "Email only" },
  { value: "both", label: "Email and in app" },
];

const channelOf = (value: unknown): NotificationPreference =>
  value === "email" || value === "in_app" || value === "both" ? value : "both";

/** Your organization: its footprint, clinics and staff. */
export const OrganizationView = (): ReactNode => {
  const session = authClient.useSession();
  const organization = useMyOrganization();
  const clinics = useOrganizationClinics();
  const createClinic = useCreateOrgClinic();
  const updateClinic = useUpdateOrgClinic();
  const preferences = useUpdateOwnPreferences();
  const [clinicId, setClinicId] = useState("");
  const [clinicName, setClinicName] = useState("");
  const isOrgAdmin = session.data?.user.role === "org_admin";

  const submitClinic = (): void => {
    createClinic.mutate({ id: clinicId.trim(), name: clinicName.trim() });
  };

  if (organization.isError) {
    return (
      <Alert color="red" title="Organization could not load">
        {errorMessage(organization.error)}
      </Alert>
    );
  }

  const org = organization.data ?? null;
  const clinicRows = clinics.data ?? [];

  return (
    <Stack gap="xl">
      <PageHeader
        eyebrow="Organization"
        title={org === null ? "Your organization" : org.name}
        subtitle="Run your clinics and care teams here. Results your clinics record appear in the patient app automatically."
      />

      {organization.isPending ? (
        <Text c="dimmed">Loading organization…</Text>
      ) : org === null ? (
        <Text c="dimmed">This account is not attached to an organization.</Text>
      ) : (
        <SimpleGrid cols={{ base: 1, sm: 3 }}>
          <Card radius="sm" p="lg" bd="1px solid var(--hermes-line)">
            <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
              Clinics
            </Text>
            <Title order={2}>{org.clinicCount}</Title>
          </Card>
          <Card radius="sm" p="lg" bd="1px solid var(--hermes-line)">
            <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
              Staff
            </Text>
            <Title order={2}>{org.staffCount}</Title>
          </Card>
          <Card radius="sm" p="lg" bd="1px solid var(--hermes-line)">
            <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
              Status
            </Text>
            <Badge mt={6} color={org.isActive ? "green" : "red"}>
              {org.isActive ? "Active" : "Paused"}
            </Badge>
          </Card>
        </SimpleGrid>
      )}

      <Card radius="sm" p="lg" bd="1px solid var(--hermes-line)">
        <Title order={3} mb="sm">
          Clinics
        </Title>
        {clinics.isError ? (
          <Alert color="red" mb="sm">
            {errorMessage(clinics.error)}
          </Alert>
        ) : null}
        <Stack gap="sm">
          {clinicRows.length === 0 ? (
            <Text size="sm" c="dimmed">
              No clinics yet. Add the first one below.
            </Text>
          ) : (
            clinicRows.map((clinic) => (
              <Group key={clinic.id} justify="space-between" wrap="nowrap">
                <Stack gap={0}>
                  <Text fw={600} size="sm">
                    {clinic.name}
                  </Text>
                  <Text size="xs" c="dimmed">
                    {clinic.id} · {clinic.timezone}
                  </Text>
                </Stack>
                <Group gap="xs" wrap="nowrap">
                  <Badge variant="light">
                    {clinic.isActive ? "Active" : "Paused"}
                  </Badge>
                  <Button
                    size="compact-xs"
                    variant="subtle"
                    loading={updateClinic.isPending}
                    onClick={() =>
                      updateClinic.mutate({
                        id: clinic.id,
                        patch: { isActive: !clinic.isActive },
                      })
                    }
                  >
                    {clinic.isActive ? "Pause" : "Resume"}
                  </Button>
                </Group>
              </Group>
            ))
          )}
        </Stack>

        <Group align="flex-end" mt="lg" grow>
          <TextInput
            label="Clinic id"
            description="Stable id used by lab feeds, e.g. aar-nairobi-cbd."
            value={clinicId}
            onChange={(event) => setClinicId(event.currentTarget.value)}
          />
          <TextInput
            label="Clinic name"
            value={clinicName}
            onChange={(event) => setClinicName(event.currentTarget.value)}
          />
          <Button
            variant="light"
            loading={createClinic.isPending}
            disabled={clinicId.trim() === "" || clinicName.trim().length < 2}
            onClick={submitClinic}
          >
            Add clinic
          </Button>
        </Group>
        {createClinic.isError ? (
          <Alert color="red" mt="sm">
            {errorMessage(createClinic.error)}
          </Alert>
        ) : null}
      </Card>

      <StaffInviteCard />

      <Card radius="sm" p="lg" bd="1px solid var(--hermes-line)">
        <Title order={3} mb="sm">
          Care team
        </Title>
        <StaffUsersTable />
      </Card>

      <Card radius="sm" p="lg" bd="1px solid var(--hermes-line)">
        <Title order={3} mb={4}>
          Your alerts
        </Title>
        <Text size="sm" c="dimmed" mb="sm">
          Hand-overs and invitations can reach you by email, in the dashboard,
          or both.
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
    </Stack>
  );
};
