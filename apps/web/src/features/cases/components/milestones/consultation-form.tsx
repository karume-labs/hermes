"use client";

import type { ConsultationOutcome } from "@hermes/types";
import { Alert, Button, Group, Select, TextInput } from "@mantine/core";
import type { ReactNode } from "react";
import { useState } from "react";
import { useRecordConsultation } from "@/features/cases/services/mutations-outcome";
import { errorMessage } from "@/features/shared/utils/form-errors";

export const ConsultationForm = ({
  caseId,
  closed,
}: {
  caseId: string;
  closed: boolean;
}): ReactNode => {
  const consultation = useRecordConsultation();
  const [outcome, setOutcome] = useState<ConsultationOutcome>("confirmed");
  const [notes, setNotes] = useState("");

  return (
    <>
      <Group align="flex-end" grow>
        <Select
          label="Consultation outcome"
          data={[
            { value: "confirmed", label: "Diagnosis confirmed" },
            {
              value: "alternative_diagnosis",
              label: "Alternative diagnosis",
            },
            { value: "no_action_needed", label: "No action needed" },
            { value: "further_referral", label: "Further referral" },
          ]}
          value={outcome}
          onChange={(value) => {
            if (
              value === "alternative_diagnosis" ||
              value === "no_action_needed" ||
              value === "further_referral"
            ) {
              setOutcome(value);
            } else {
              setOutcome("confirmed");
            }
          }}
          disabled={closed}
        />
        <TextInput
          label="Consultation notes"
          placeholder="What the clinician concluded"
          value={notes}
          onChange={(event) => setNotes(event.currentTarget.value)}
          disabled={closed}
        />
        <Button
          variant="light"
          loading={consultation.isPending}
          disabled={closed || notes.trim().length < 3}
          onClick={() => consultation.mutate({ caseId, outcome, notes })}
        >
          Record consultation
        </Button>
      </Group>
      {consultation.error === null ? null : (
        <Alert color="red" mt="sm">
          {errorMessage(consultation.error)}
        </Alert>
      )}
    </>
  );
};
