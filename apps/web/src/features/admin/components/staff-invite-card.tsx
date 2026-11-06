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
import { useClinics } from "@/features/admin/services/queries";
import { errorMessage } from "@/features/shared/utils/form-errors";

const ROLES: { value: StaffRole; label: string }[] = [
  { value: "coordinator", label: "Coordinator" },
  { value: "admin", label: "Administrator" },
];

export const StaffInviteCard = (): ReactNode => {
  const clinics = useClinics();
  const create = useCreateStaffInvite();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<StaffRole>("coordinator");
  const [clinicId, setClinicId] = useState<string | null>(null);

  const clinicOptions = (clinics.data ?? []).map((clinic) => ({
    value: clinic.id,
    label: clinic.name,
  }));

  const submit = (): void => {
    create.mutate(
      role === "coordinator" && clinicId !== null
        ? { name, email, role, clinicId }
        : { name, email, role },
    );
  };

  return (
    <Card
      radius="sm"
      p="xl"
      bg="brandChalk.0"
      bd="1px solid var(--mantine-color-brandChalk-3)"
    >
      <Stack gap="md">
        <Text fw={700}>Invite a staff member</Text>
        <Text size="sm" c="dimmed">
          The invite link works once and expires after seven days. There is no
          public sign-up.
        </Text>

        {create.isError ? (
          <Alert color="red" title="Invite not created">
            {errorMessage(create.error)}
          </Alert>
        ) : null}

        {create.data === undefined ? null : (
          <Alert color="green" title="Invite ready to share">
            <Stack gap={6}>
              <Text size="sm">
                Send this link to {create.data.email}. It is shown only once.
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
            data={ROLES}
            value={role}
            onChange={(value) =>
              setRole(value === "admin" ? "admin" : "coordinator")
            }
            allowDeselect={false}
          />
          <Select
            label="Clinic"
            description="Coordinators must be assigned to one clinic."
            data={clinicOptions}
            value={clinicId}
            onChange={setClinicId}
            clearable
            searchable
          />
        </Group>

        <Group justify="flex-end">
          <Button
            leftSection={<IconUserPlus size={16} />}
            loading={create.isPending}
            disabled={
              name.trim().length < 2 ||
              email.trim().length < 3 ||
              (role === "coordinator" && clinicId === null)
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
