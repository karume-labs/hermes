"use client";

import {
  Alert,
  Badge,
  Button,
  Card,
  Group,
  Stack,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import Link from "next/link";
import type { ReactNode } from "react";
import { useState } from "react";
import {
  useCreateOrgClinic,
  useUpdateOrgClinic,
} from "@/features/admin/services/organization-mutations";
import { useOrganizationClinics } from "@/features/admin/services/organization-queries";
import { authClient } from "@/features/auth/services/client";
import { errorMessage } from "@/features/shared/utils/form-errors";

export const OrgClinicsCard = (): ReactNode => {
  const session = authClient.useSession();
  const role = session.data?.user.role;
  // A platform operator belongs to no organization, so asking for "my
  // organization's clinics" answers 409. Wait for the session and skip it.
  const isPlatformAdmin = role === "admin";
  const clinics = useOrganizationClinics(
    role !== undefined && !isPlatformAdmin,
  );
  const createClinic = useCreateOrgClinic();
  const updateClinic = useUpdateOrgClinic();
  const [clinicId, setClinicId] = useState("");
  const [clinicName, setClinicName] = useState("");
  const clinicRows = clinics.data ?? [];

  const submitClinic = (): void => {
    createClinic.mutate({ id: clinicId.trim(), name: clinicName.trim() });
  };

  if (isPlatformAdmin) {
    return (
      <Card radius="sm" p="lg" bd="1px solid var(--hermes-line)">
        <Title order={3} mb="sm">
          Clinics
        </Title>
        <Text size="sm" c="dimmed" mb="md">
          Your account is not attached to one organization. Every clinic in the
          network is managed from the clinic directory.
        </Text>
        <Button
          component={Link}
          href="/admin/clinics"
          variant="light"
          w="fit-content"
        >
          Open clinic directory
        </Button>
      </Card>
    );
  }

  return (
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
  );
};
