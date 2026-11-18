"use client";

import { Alert, Card, SimpleGrid, Stack, Text } from "@mantine/core";
import {
  IconBuildingCommunity,
  IconBuildingHospital,
  IconCircleCheck,
  IconPlayerPause,
  IconUsers,
} from "@tabler/icons-react";
import type { ReactNode } from "react";
import { OrgAlertPreferencesCard } from "@/features/admin/components/org-alert-preferences-card";
import { OrgClinicsCard } from "@/features/admin/components/org-clinics-card";
import { StaffInviteCard } from "@/features/admin/components/staff-invite-card";
import { StaffUsersTable } from "@/features/admin/components/staff-users-table";
import { useMyOrganization } from "@/features/admin/services/organization-queries";
import { PageHeader } from "@/features/shared/components/layout/page-header";
import { MetricCard } from "@/features/shared/components/ui/metric-card";
import { SectionHeader } from "@/features/shared/components/ui/section-header";
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
        icon={<IconBuildingCommunity size={24} />}
        tone="info"
      />

      {organization.isPending ? (
        <Text c="dimmed">Loading organization…</Text>
      ) : org === null ? (
        <Text c="dimmed">This account is not attached to an organization.</Text>
      ) : (
        <SimpleGrid cols={{ base: 1, sm: 3 }}>
          <MetricCard
            label="Clinics"
            value={org.clinicCount}
            icon={<IconBuildingHospital size={18} />}
            tone="info"
            hint="Clinics recording results under this organization"
          />
          <MetricCard
            label="Staff"
            value={org.staffCount}
            icon={<IconUsers size={18} />}
            hint="Accounts with access to those clinics"
          />
          <MetricCard
            label="Status"
            value={org.isActive ? "Active" : "Paused"}
            icon={
              org.isActive ? (
                <IconCircleCheck size={18} />
              ) : (
                <IconPlayerPause size={18} />
              )
            }
            tone={org.isActive ? "routine" : "urgent"}
            hint={
              org.isActive
                ? "Results route in and the patient app is live"
                : "Data is kept, but no new results are accepted"
            }
          />
        </SimpleGrid>
      )}

      <OrgClinicsCard />
      <StaffInviteCard />

      <Card p="lg" bg="var(--hermes-surface)" bd="1px solid var(--hermes-line)">
        <Stack gap="md">
          <SectionHeader
            icon={<IconUsers size={19} />}
            title="Care team"
            hint="Everyone who can sign in to this organization"
          />
          <StaffUsersTable />
        </Stack>
      </Card>

      <OrgAlertPreferencesCard />
    </Stack>
  );
};
