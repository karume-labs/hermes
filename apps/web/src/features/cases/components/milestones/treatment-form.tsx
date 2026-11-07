"use client";

import { Alert, Button, Group, TextInput } from "@mantine/core";
import type { ReactNode } from "react";
import { useState } from "react";
import { useRecordTreatment } from "@/features/cases/services/mutations-outcome";
import { errorMessage } from "@/features/shared/utils/form-errors";

export const TreatmentForm = ({
  caseId,
  closed,
}: {
  caseId: string;
  closed: boolean;
}): ReactNode => {
  const treatment = useRecordTreatment();
  const [summary, setSummary] = useState("");

  return (
    <>
      <Group align="flex-end" grow>
        <TextInput
          label="Treatment started"
          placeholder="Treatment and first dose / plan"
          value={summary}
          onChange={(event) => setSummary(event.currentTarget.value)}
          disabled={closed}
        />
        <Button
          variant="light"
          loading={treatment.isPending}
          disabled={closed || summary.trim().length < 3}
          onClick={() => treatment.mutate({ caseId, summary })}
        >
          Record treatment
        </Button>
      </Group>
      {treatment.error === null ? null : (
        <Alert color="red" mt="sm">
          {errorMessage(treatment.error)}
        </Alert>
      )}
    </>
  );
};
