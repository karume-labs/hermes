"use client";

import type { CaseDetail } from "@hermes/types";
import {
  Alert,
  Badge,
  Button,
  Card,
  Group,
  Select,
  Stack,
  Text,
  Textarea,
  Title,
} from "@mantine/core";
import { type ReactNode, useState } from "react";
import { authClient } from "@/features/auth/services/client";
import { useHandoverCase } from "@/features/cases/services/mutations-team";
import { useCareTeam } from "@/features/cases/services/queries";
import { errorMessage } from "@/features/shared/utils/form-errors";

const accessTone = (access: string): string =>
  access === "owner" ? "green" : access === "collaborator" ? "blue" : "gray";

/** Multi-clinician case: named owner, collaborators and read-only history. */
export const CaseTeam = ({ detail }: { detail: CaseDetail }): ReactNode => {
  const session = authClient.useSession();
  const team = useCareTeam();
  const handover = useHandoverCase();
  const [toUserId, setToUserId] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const me = session.data?.user;

  const options = (team.data ?? [])
    .filter(
      (member) =>
        (member.role === "clinician" || member.role === "coordinator") &&
        member.id !== me?.id,
    )
    .map((member) => ({
      value: member.id,
      label: `${member.name} · ${member.role}`,
    }));

  return (
    <Card withBorder radius="md" p="lg">
      <Group justify="space-between" mb="sm">
        <Title order={3}>Care team on this case</Title>
        <Badge variant="light">{detail.clinicians.length} with access</Badge>
      </Group>
      <Text size="sm" c="dimmed" mb="sm">
        The owner carries the next step. Collaborators can work the case, and a
        clinician who hands it over keeps read access to the history.
      </Text>

      <Stack gap="xs" mb="md">
        {detail.clinicians.map((clinician) => (
          <Group key={clinician.id} justify="space-between" wrap="nowrap">
            <Text size="sm">
              {clinician.name} · {clinician.clinicName ?? clinician.clinicId}
            </Text>
            <Group gap="xs" wrap="nowrap">
              <Badge color={accessTone(clinician.access)} variant="light">
                {clinician.access}
              </Badge>
              <Text size="xs" c="dimmed">
                since {new Date(clinician.grantedAt).toLocaleDateString()}
              </Text>
            </Group>
          </Group>
        ))}
        {detail.clinicians.length === 0 ? (
          <Text size="sm" c="dimmed">
            Nobody has been recorded on this case yet.
          </Text>
        ) : null}
      </Stack>

      {handover.isError ? (
        <Alert color="red" mb="sm">
          {errorMessage(handover.error)}
        </Alert>
      ) : null}

      <Stack gap="sm">
        <Select
          label="Hand this case to another clinician"
          description="They become the named owner. You keep read access."
          data={options}
          value={toUserId}
          onChange={setToUserId}
          searchable
          nothingFoundMessage="No other clinicians in this care team"
        />
        <Textarea
          label="Hand-over note"
          minRows={2}
          value={note}
          onChange={(event) => setNote(event.currentTarget.value)}
        />
        <Group justify="flex-end">
          <Button
            loading={handover.isPending}
            disabled={
              toUserId === null ||
              note.trim().length < 8 ||
              detail.status === "closed"
            }
            onClick={() => {
              if (toUserId === null) return;
              handover.mutate({ caseId: detail.id, toUserId, note });
            }}
          >
            Hand over case
          </Button>
        </Group>
      </Stack>
    </Card>
  );
};
