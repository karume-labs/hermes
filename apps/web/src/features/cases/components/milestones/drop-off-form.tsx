"use client";

import type { RecordDropOffBody } from "@hermes/validators";
import { Alert, Button, Group, Select, TextInput } from "@mantine/core";
import type { ReactNode } from "react";
import { useState } from "react";
import { useRecordDropOff } from "@/features/cases/services/mutations-outcome";
import { errorMessage } from "@/features/shared/utils/form-errors";

export const DropOffForm = ({
  caseId,
  closed,
}: {
  caseId: string;
  closed: boolean;
}): ReactNode => {
  const dropOff = useRecordDropOff();
  const [reason, setReason] =
    useState<RecordDropOffBody["reason"]>("unreachable");
  const [note, setNote] = useState("");

  return (
    <>
      <Group align="flex-end" grow>
        <Select
          label="Drop-off reason"
          data={[
            { value: "unreachable", label: "Unreachable" },
            { value: "declined_care", label: "Declined care" },
            { value: "transport", label: "Transport" },
            { value: "cost", label: "Cost" },
            { value: "no_show", label: "No-show" },
            { value: "other", label: "Other" },
          ]}
          value={reason}
          onChange={(value) => {
            if (
              value === "declined_care" ||
              value === "transport" ||
              value === "cost" ||
              value === "no_show" ||
              value === "other"
            ) {
              setReason(value);
            } else {
              setReason("unreachable");
            }
          }}
          disabled={closed}
        />
        <TextInput
          label="Context"
          placeholder="Optional detail for the quality review"
          value={note}
          onChange={(event) => setNote(event.currentTarget.value)}
          disabled={closed}
        />
        <Button
          variant="light"
          color="orange"
          loading={dropOff.isPending}
          disabled={closed}
          onClick={() =>
            dropOff.mutate({
              caseId,
              reason,
              note: note === "" ? undefined : note,
            })
          }
        >
          Record delay reason
        </Button>
      </Group>
      {dropOff.error === null ? null : (
        <Alert color="red" mt="sm">
          {errorMessage(dropOff.error)}
        </Alert>
      )}
    </>
  );
};
