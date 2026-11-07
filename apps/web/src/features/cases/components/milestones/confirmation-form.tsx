"use client";

import type { RecordConfirmationBody } from "@hermes/validators";
import { Alert, Button, Group, Select, TextInput } from "@mantine/core";
import type { ReactNode } from "react";
import { useState } from "react";
import { useRecordConfirmation } from "@/features/cases/services/mutations-outcome";
import { errorMessage } from "@/features/shared/utils/form-errors";

export const ConfirmationForm = ({
  caseId,
  closed,
}: {
  caseId: string;
  closed: boolean;
}): ReactNode => {
  const confirmation = useRecordConfirmation();
  const [status, setStatus] =
    useState<RecordConfirmationBody["status"]>("confirmed");
  const [notes, setNotes] = useState("");

  return (
    <>
      <Group align="flex-end" grow>
        <Select
          label="Confirmatory test"
          data={[
            { value: "confirmed", label: "Condition confirmed" },
            { value: "ruled_out", label: "Ruled out" },
          ]}
          value={status}
          onChange={(value) =>
            setStatus(value === "ruled_out" ? "ruled_out" : "confirmed")
          }
          disabled={closed}
        />
        <TextInput
          label="Result notes"
          placeholder="Repeat result and interpretation"
          value={notes}
          onChange={(event) => setNotes(event.currentTarget.value)}
          disabled={closed}
        />
        <Button
          variant="light"
          loading={confirmation.isPending}
          disabled={closed || notes.trim().length < 3}
          onClick={() => confirmation.mutate({ caseId, status, notes })}
        >
          Record confirmation
        </Button>
      </Group>
      {confirmation.error === null ? null : (
        <Alert color="red" mt="sm">
          {errorMessage(confirmation.error)}
        </Alert>
      )}
    </>
  );
};
