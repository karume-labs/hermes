"use client";

import type { CaseDetail } from "@hermes/types";
import {
  Alert,
  Button,
  Card,
  Group,
  Stack,
  Text,
  Textarea,
  Title,
} from "@mantine/core";
import type { ReactNode } from "react";
import { useState } from "react";
import { useAddConsultNote } from "@/features/cases/services/mutations-outcome";
import { errorMessage } from "@/features/shared/utils/form-errors";

// Clinician-to-clinician discussion. This thread is never shown in the patient
// app; the patient-facing secure messages live on their own tab.
export const CaseConsultNotes = ({
  detail,
}: {
  detail: CaseDetail;
}): ReactNode => {
  const add = useAddConsultNote();
  const [body, setBody] = useState("");
  const closed = detail.status === "closed";

  return (
    <Card withBorder radius="md" p="lg">
      <Title order={3} mb="xs">
        Clinician-to-clinician consultation
      </Title>
      <Text size="sm" c="dimmed" mb="sm">
        Internal notes for the referring and receiving clinical teams. The
        patient cannot see this thread.
      </Text>
      {add.isError ? (
        <Alert color="red" mb="sm">
          {errorMessage(add.error)}
        </Alert>
      ) : null}
      <Stack gap="sm">
        {detail.consultNotes.map((note) => (
          <Card key={note.id} withBorder radius="sm" p="sm">
            <Group justify="space-between">
              <Text size="xs" fw={600}>
                {note.authorName} · {note.authorRole}
              </Text>
              <Text size="xs" c="dimmed">
                {new Date(note.createdAt).toLocaleString()}
              </Text>
            </Group>
            <Text size="sm">{note.body}</Text>
          </Card>
        ))}
        {detail.consultNotes.length === 0 ? (
          <Text size="sm" c="dimmed">
            No clinical consultation notes yet.
          </Text>
        ) : null}
        <Textarea
          label="Add a clinical note"
          placeholder="Share findings, questions or the agreed plan with the other clinical team"
          minRows={2}
          value={body}
          onChange={(event) => setBody(event.currentTarget.value)}
          disabled={closed}
        />
        <Group justify="flex-end">
          <Button
            loading={add.isPending}
            disabled={closed || body.trim().length < 2}
            onClick={() =>
              add.mutate(
                { caseId: detail.id, body },
                { onSuccess: () => setBody("") },
              )
            }
          >
            Post clinical note
          </Button>
        </Group>
      </Stack>
    </Card>
  );
};
