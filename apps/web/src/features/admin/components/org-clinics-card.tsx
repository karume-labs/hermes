"use client";

import {
  Alert,
  Button,
  Card,
  Divider,
  Group,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
} from "@mantine/core";
import { IconBuildingHospital, IconPlus } from "@tabler/icons-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { useState } from "react";
import { ClinicTile } from "@/features/admin/components/clinic-tile";
import {
  useCreateOrgClinic,
  useUpdateOrgClinic,
} from "@/features/admin/services/organization-mutations";
import { useOrganizationClinics } from "@/features/admin/services/organization-queries";
import { authClient } from "@/features/auth/services/client";
import { IconTile } from "@/features/shared/components/ui/icon-tile";
import { SectionHeader } from "@/features/shared/components/ui/section-header";
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
      <Card p="lg" bg="var(--hermes-surface)" bd="1px solid var(--hermes-line)">
        <Stack gap="md">
          <SectionHeader
            icon={<IconBuildingHospital size={19} />}
            title="Clinics"
            hint="Platform accounts run the whole network"
            tone="info"
          />
          <Text size="sm" c="var(--hermes-ink-muted)">
            Your account is not attached to one organization. Every clinic in
            the network is managed from the clinic directory.
          </Text>
          <Button
            component={Link}
            href="/admin/clinics"
            variant="light"
            w="fit-content"
            leftSection={<IconBuildingHospital size={15} />}
          >
            Open clinic directory
          </Button>
        </Stack>
      </Card>
    );
  }

  return (
    <Card p="lg" bg="var(--hermes-surface)" bd="1px solid var(--hermes-line)">
      <Stack gap="lg">
        <SectionHeader
          icon={<IconBuildingHospital size={19} />}
          title="Clinics"
          hint={`${clinicRows.filter((clinic) => clinic.isActive).length} receiving results · ${clinicRows.length} total`}
          tone="info"
        />

        {clinics.isError ? (
          <Alert color="red">{errorMessage(clinics.error)}</Alert>
        ) : null}

        {clinicRows.length === 0 ? (
          <Group gap="sm" align="center">
            <IconTile size={34}>
              <IconBuildingHospital size={17} />
            </IconTile>
            <Text size="sm" c="var(--hermes-ink-muted)">
              No clinics yet. Add the first one below.
            </Text>
          </Group>
        ) : (
          <SimpleGrid cols={{ base: 1, sm: 2 }}>
            {clinicRows.map((clinic) => (
              <ClinicTile
                key={clinic.id}
                clinic={clinic}
                busy={updateClinic.isPending}
                onToggle={() =>
                  updateClinic.mutate({
                    id: clinic.id,
                    patch: { isActive: !clinic.isActive },
                  })
                }
              />
            ))}
          </SimpleGrid>
        )}

        <Divider />

        <Group align="flex-end" grow>
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
            leftSection={<IconPlus size={15} />}
            loading={createClinic.isPending}
            disabled={clinicId.trim() === "" || clinicName.trim().length < 2}
            onClick={submitClinic}
          >
            Add clinic
          </Button>
        </Group>

        {createClinic.isError ? (
          <Alert color="red">{errorMessage(createClinic.error)}</Alert>
        ) : null}
      </Stack>
    </Card>
  );
};
