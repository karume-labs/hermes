"use client";

import {
  Alert,
  Badge,
  Card,
  SimpleGrid,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import type { ReactNode } from "react";
import { OrgAlertPreferencesCard } from "@/features/admin/components/org-alert-preferences-card";
import { OrgClinicsCard } from "@/features/admin/components/org-clinics-card";
import { StaffInviteCard } from "@/features/admin/components/staff-invite-card";
import { StaffUsersTable } from "@/features/admin/components/staff-users-table";
import { useMyOrganization } from "@/features/admin/services/organization-queries";
import { PageHeader } from "@/features/shared/components/layout/page-header";
import { errorMessage } from "@/features/shared/utils/form-errors";

/** Your organization: its footprint, clinics and staff. */
export const OrganizationView = (): ReactNode => {
  const organization = useMyOrganization();

  if (organization.isError) {
    return (
      <Alert color="red" title="Organization could not load">
        {errorMessage(organization.error)}
      </Alert>
    );
  }

  const org = organization.data ?? null;

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

      <OrgClinicsCard />
      <StaffInviteCard />

      <Card radius="sm" p="lg" bd="1px solid var(--hermes-line)">
        <Title order={3} mb="sm">
          Care team
        </Title>
        <StaffUsersTable />
      </Card>

      <OrgAlertPreferencesCard />
    </Stack>
  );
};
