"use client";

import type { StaffRole } from "@hermes/types";
import {
  Alert,
  Button,
  Card,
  Group,
  Stack,
  Text,
  TextInput,
} from "@mantine/core";
import { IconUserPlus } from "@tabler/icons-react";
import { type ReactNode, useState } from "react";
import { StaffInviteResult } from "@/features/admin/components/staff-invite-result";
import { StaffInviteTarget } from "@/features/admin/components/staff-invite-target";
import { useCreateStaffInvite } from "@/features/admin/services/mutations";
import {
  useOrganizationClinics,
  useOrganizations,
} from "@/features/admin/services/organization-queries";
import { useClinics } from "@/features/admin/services/queries";
import { authClient } from "@/features/auth/services/client";
import { errorMessage } from "@/features/shared/utils/form-errors";

export const StaffInviteCard = (): ReactNode => {
  const session = authClient.useSession();
  const isPlatformAdmin = session.data?.user.role === "admin";
  // Platform operators pick any clinic or organization; an org admin is
  // limited to the clinics of their own organization.
  const clinics = useClinics(isPlatformAdmin);
  const orgClinics = useOrganizationClinics(!isPlatformAdmin);
  const organizations = useOrganizations(isPlatformAdmin);
  const create = useCreateStaffInvite();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<StaffRole>("coordinator");
  const [clinicId, setClinicId] = useState<string | null>(null);
  const [organizationId, setOrganizationId] = useState<string | null>(null);

  const clinicRows = isPlatformAdmin
    ? (clinics.data ?? [])
    : (orgClinics.data ?? []);
  const clinicOptions = clinicRows.map((clinic) => ({
    value: clinic.id,
    label: clinic.name,
  }));
  const organizationOptions = (organizations.data ?? []).map(
    (organization) => ({
      value: organization.id,
      label: organization.name,
    }),
  );
  const needsClinic = role === "coordinator" || role === "clinician";

  const submit = (): void => {
    create.mutate({
      name,
      email,
      role,
      ...(needsClinic && clinicId !== null ? { clinicId } : {}),
      ...(isPlatformAdmin && organizationId !== null ? { organizationId } : {}),
    });
  };

  return (
    <Card
      radius="sm"
      p="xl"
      bg="var(--hermes-surface)"
      bd="1px solid var(--hermes-line)"
    >
      <Stack gap="md">
        <Text fw={700}>Invite a staff member</Text>
        <Text size="sm" c="dimmed">
          The invite link works once and expires after seven days. There is no
          public sign-up for staff.
        </Text>

        {create.isError ? (
          <Alert color="red" title="Invite not created">
            {errorMessage(create.error)}
          </Alert>
        ) : null}

        {create.data === undefined ? null : (
          <StaffInviteResult result={create.data} />
        )}

        <Group align="flex-end" grow>
          <TextInput
            label="Full name"
            value={name}
            onChange={(event) => setName(event.currentTarget.value)}
          />
          <TextInput
            label="Work email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.currentTarget.value)}
          />
        </Group>
        <StaffInviteTarget
          isPlatformAdmin={isPlatformAdmin}
          role={role}
          onRoleChange={setRole}
          needsClinic={needsClinic}
          clinicOptions={clinicOptions}
          clinicId={clinicId}
          onClinicChange={setClinicId}
          organizationOptions={organizationOptions}
          organizationId={organizationId}
          onOrganizationChange={setOrganizationId}
        />

        <Group justify="flex-end">
          <Button
            leftSection={<IconUserPlus size={16} />}
            loading={create.isPending}
            disabled={
              name.trim().length < 2 ||
              email.trim().length < 3 ||
              (needsClinic && clinicId === null) ||
              (isPlatformAdmin &&
                !needsClinic &&
                role === "org_admin" &&
                organizationId === null)
            }
            onClick={submit}
          >
            Create invite
          </Button>
        </Group>
      </Stack>
    </Card>
  );
};
