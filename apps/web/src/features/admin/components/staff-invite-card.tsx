"use client";

import type { StaffRole } from "@hermes/types";
import {
  Alert,
  Button,
  Card,
  Code,
  CopyButton,
  Group,
  Select,
  Stack,
  Text,
  TextInput,
} from "@mantine/core";
import { IconUserPlus } from "@tabler/icons-react";
import { type ReactNode, useState } from "react";
import { useCreateStaffInvite } from "@/features/admin/services/mutations";
import {
  useOrganizationClinics,
  useOrganizations,
} from "@/features/admin/services/organization-queries";
import { useClinics } from "@/features/admin/services/queries";
import { authClient } from "@/features/auth/services/client";
import { errorMessage } from "@/features/shared/utils/form-errors";

const CLINICAL_ROLES: { value: StaffRole; label: string }[] = [
  { value: "coordinator", label: "Coordinator" },
  { value: "clinician", label: "Clinician" },
];

const PLATFORM_ROLES: { value: StaffRole; label: string }[] = [
  ...CLINICAL_ROLES,
  { value: "org_admin", label: "Organization admin" },
  { value: "admin", label: "Platform administrator" },
];

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
          <Alert
            color={create.data.emailSent ? "green" : "yellow"}
            title={
              create.data.emailSent
                ? "Invite emailed"
                : "Invite ready, email not sent"
            }
          >
            <Stack gap={6}>
              <Text size="sm">
                {create.data.emailSent
                  ? `We emailed the invite to ${create.data.email}. The link is also shown here once.`
                  : `Email delivery failed for ${create.data.email}. Share this link directly.`}
              </Text>
              <Group gap="xs" wrap="nowrap">
                <Code style={{ overflowWrap: "anywhere" }}>
                  {create.data.inviteUrl}
                </Code>
                <CopyButton value={create.data.inviteUrl}>
                  {({ copied, copy }) => (
                    <Button size="compact-xs" variant="light" onClick={copy}>
                      {copied ? "Copied" : "Copy"}
                    </Button>
                  )}
                </CopyButton>
              </Group>
            </Stack>
          </Alert>
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
        <Group align="flex-end" grow>
          <Select
            label="Role"
            data={isPlatformAdmin ? PLATFORM_ROLES : CLINICAL_ROLES}
            value={role}
            onChange={(value) =>
              setRole(value === "clinician" ? "clinician" : "coordinator")
            }
            allowDeselect={false}
          />
          {needsClinic ? (
            <Select
              label="Clinic"
              description="Coordinators and clinicians must be assigned to one clinic."
              data={clinicOptions}
              value={clinicId}
              onChange={setClinicId}
              clearable
              searchable
            />
          ) : isPlatformAdmin ? (
            <Select
              label="Organization"
              description="The organization this admin will run."
              data={organizationOptions}
              value={organizationId}
              onChange={setOrganizationId}
              searchable
            />
          ) : null}
        </Group>

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
