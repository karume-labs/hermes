"use client";

import { Alert, Button, Group, TextInput } from "@mantine/core";
import type { ReactNode } from "react";
import { useState } from "react";
import { useRecordSurveillance } from "@/features/cases/services/mutations-outcome";
import { errorMessage } from "@/features/shared/utils/form-errors";

export const SurveillanceForm = ({
  caseId,
  closed,
}: {
  caseId: string;
  closed: boolean;
}): ReactNode => {
  const surveillance = useRecordSurveillance();
  const [plan, setPlan] = useState("");
  const [reviewAt, setReviewAt] = useState("");

  return (
    <>
      <Group align="flex-end" grow>
        <TextInput
          label="Surveillance plan"
          placeholder="Repeat labs, review interval, owner"
          value={plan}
          onChange={(event) => setPlan(event.currentTarget.value)}
          disabled={closed}
        />
        <TextInput
          label="Next review"
          type="datetime-local"
          value={reviewAt}
          onChange={(event) => setReviewAt(event.currentTarget.value)}
          disabled={closed}
        />
        <Button
          variant="light"
          loading={surveillance.isPending}
          disabled={closed || plan.trim().length < 3 || reviewAt === ""}
          onClick={() =>
            surveillance.mutate({
              caseId,
              plan,
              nextReviewAt: new Date(reviewAt).toISOString(),
            })
          }
        >
          Record surveillance
        </Button>
      </Group>
      {surveillance.error === null ? null : (
        <Alert color="red" mt="sm">
          {errorMessage(surveillance.error)}
        </Alert>
      )}
    </>
  );
};
