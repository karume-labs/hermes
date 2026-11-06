"use client";

import type { CaseDetail, ConsultationOutcome } from "@hermes/types";
import type {
  RecordConfirmationBody,
  RecordDropOffBody,
} from "@hermes/validators";
import {
  Alert,
  Button,
  Card,
  Group,
  Select,
  Stack,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import type { ReactNode } from "react";
import { useState } from "react";
import {
  useRecordConfirmation,
  useRecordConsultation,
  useRecordDropOff,
  useRecordSurveillance,
  useRecordTreatment,
} from "@/features/cases/services/mutations";
import { errorMessage } from "@/features/shared/utils/form-errors";

const stamp = (value: string | null, label: string): string =>
  value === null
    ? `${label}: pending`
    : `${label}: ${new Date(value).toLocaleString()}`;

export const CaseMilestones = ({
  detail,
}: {
  detail: CaseDetail;
}): ReactNode => {
  const confirmation = useRecordConfirmation();
  const consultation = useRecordConsultation();
  const treatment = useRecordTreatment();
  const surveillance = useRecordSurveillance();
  const dropOff = useRecordDropOff();
  const [confirmationStatus, setConfirmationStatus] =
    useState<RecordConfirmationBody["status"]>("confirmed");
  const [confirmationNotes, setConfirmationNotes] = useState("");
  const [outcome, setOutcome] = useState<ConsultationOutcome>("confirmed");
  const [consultationNotes, setConsultationNotes] = useState("");
  const [treatmentSummary, setTreatmentSummary] = useState("");
  const [surveillancePlan, setSurveillancePlan] = useState("");
  const [reviewAt, setReviewAt] = useState("");
  const [dropReason, setDropReason] =
    useState<RecordDropOffBody["reason"]>("unreachable");
  const [dropNote, setDropNote] = useState("");
  const closed = detail.status === "closed";
  const error =
    confirmation.error ??
    consultation.error ??
    treatment.error ??
    surveillance.error ??
    dropOff.error;

  return (
    <Card withBorder radius="md" p="lg">
      <Title order={3}>Clinical milestones</Title>
      <Text size="sm" c="dimmed" mb="sm">
        {stamp(detail.confirmedAt, "Confirmation")} ·{" "}
        {stamp(detail.consultedAt, "Consultation")} ·{" "}
        {stamp(detail.treatmentStartedAt, "Treatment")}
      </Text>
      {detail.confirmationNotes === null ? null : (
        <Text size="sm">Confirmation: {detail.confirmationNotes}</Text>
      )}
      {detail.consultationNotes === null ? null : (
        <Text size="sm">Consultation: {detail.consultationNotes}</Text>
      )}
      {detail.treatmentSummary === null ? null : (
        <Text size="sm">Treatment: {detail.treatmentSummary}</Text>
      )}
      {detail.surveillancePlan === null ? null : (
        <Text size="sm">
          Surveillance: {detail.surveillancePlan} · Next review{" "}
          {detail.nextReviewAt === null
            ? "not set"
            : new Date(detail.nextReviewAt).toLocaleDateString()}
        </Text>
      )}
      {detail.dropOffReason === null ? null : (
        <Text size="sm" c="orange.8">
          Drop-off recorded: {detail.dropOffReason}
        </Text>
      )}
      {error === null ? null : (
        <Alert color="red" mt="sm">
          {errorMessage(error)}
        </Alert>
      )}

      <Stack gap="md" mt="md">
        <Group align="flex-end" grow>
          <Select
            label="Confirmatory test"
            data={[
              { value: "confirmed", label: "Condition confirmed" },
              { value: "ruled_out", label: "Ruled out" },
            ]}
            value={confirmationStatus}
            onChange={(value) =>
              setConfirmationStatus(
                value === "ruled_out" ? "ruled_out" : "confirmed",
              )
            }
            disabled={closed}
          />
          <TextInput
            label="Result notes"
            placeholder="Repeat result and interpretation"
            value={confirmationNotes}
            onChange={(event) =>
              setConfirmationNotes(event.currentTarget.value)
            }
            disabled={closed}
          />
          <Button
            variant="light"
            loading={confirmation.isPending}
            disabled={closed || confirmationNotes.trim().length < 3}
            onClick={() =>
              confirmation.mutate({
                caseId: detail.id,
                status: confirmationStatus,
                notes: confirmationNotes,
              })
            }
          >
            Record confirmation
          </Button>
        </Group>

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
            value={consultationNotes}
            onChange={(event) =>
              setConsultationNotes(event.currentTarget.value)
            }
            disabled={closed}
          />
          <Button
            variant="light"
            loading={consultation.isPending}
            disabled={closed || consultationNotes.trim().length < 3}
            onClick={() =>
              consultation.mutate({
                caseId: detail.id,
                outcome,
                notes: consultationNotes,
              })
            }
          >
            Record consultation
          </Button>
        </Group>

        <Group align="flex-end" grow>
          <TextInput
            label="Treatment started"
            placeholder="Treatment and first dose / plan"
            value={treatmentSummary}
            onChange={(event) => setTreatmentSummary(event.currentTarget.value)}
            disabled={closed}
          />
          <Button
            variant="light"
            loading={treatment.isPending}
            disabled={closed || treatmentSummary.trim().length < 3}
            onClick={() =>
              treatment.mutate({
                caseId: detail.id,
                summary: treatmentSummary,
              })
            }
          >
            Record treatment
          </Button>
        </Group>

        <Group align="flex-end" grow>
          <TextInput
            label="Surveillance plan"
            placeholder="Repeat labs, review interval, owner"
            value={surveillancePlan}
            onChange={(event) => setSurveillancePlan(event.currentTarget.value)}
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
            disabled={
              closed || surveillancePlan.trim().length < 3 || reviewAt === ""
            }
            onClick={() =>
              surveillance.mutate({
                caseId: detail.id,
                plan: surveillancePlan,
                nextReviewAt: new Date(reviewAt).toISOString(),
              })
            }
          >
            Record surveillance
          </Button>
        </Group>

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
            value={dropReason}
            onChange={(value) => {
              if (
                value === "declined_care" ||
                value === "transport" ||
                value === "cost" ||
                value === "no_show" ||
                value === "other"
              ) {
                setDropReason(value);
              } else {
                setDropReason("unreachable");
              }
            }}
            disabled={closed}
          />
          <TextInput
            label="Context"
            placeholder="Optional detail for the quality review"
            value={dropNote}
            onChange={(event) => setDropNote(event.currentTarget.value)}
            disabled={closed}
          />
          <Button
            variant="light"
            color="orange"
            loading={dropOff.isPending}
            disabled={closed}
            onClick={() =>
              dropOff.mutate({
                caseId: detail.id,
                reason: dropReason,
                note: dropNote === "" ? undefined : dropNote,
              })
            }
          >
            Record delay reason
          </Button>
        </Group>
      </Stack>
    </Card>
  );
};
