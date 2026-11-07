"use client";

import type { CaseDetail } from "@hermes/types";
import { Alert, Badge, Card, Group, Stack, Text } from "@mantine/core";
import type { ReactNode } from "react";

const CARD_STYLE = "1px solid var(--mantine-color-brandChalk-3)";

const asSentence = (value: string | null): string => {
  if (value === null) return "not recorded";
  return value;
};

export const CaseSummaryCard = ({
  careCase,
}: {
  careCase: CaseDetail;
}): ReactNode => (
  <Card radius="sm" p="xl" bg="brandChalk.0" bd={CARD_STYLE}>
    <Text
      size="xs"
      c="brandSlate.5"
      tt="uppercase"
      fw={700}
      lts="0.1em"
      mb="sm"
    >
      Plain-language summary sent to the patient
    </Text>
    <Text size="md" lh={1.6}>
      {careCase.summaryPlainLanguage}
    </Text>
    <Group mt="lg" gap="xl">
      <Text size="xs" c="dimmed">
        Received {new Date(careCase.createdAt).toLocaleString()}
      </Text>
      <Text size="xs" c="dimmed">
        SLA due {new Date(careCase.slaDueAt).toLocaleString()}
      </Text>
      <Text size="xs" c="dimmed">
        Lab payload {careCase.labPayloadId.slice(0, 18)}
      </Text>
    </Group>
  </Card>
);

export const CareContinuityCard = ({
  careCase,
}: {
  careCase: CaseDetail;
}): ReactNode => (
  <Card radius="sm" p="lg" bd={CARD_STYLE}>
    <Group justify="space-between" align="flex-start">
      <Stack gap={2}>
        <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
          Care continuity
        </Text>
        <Text size="sm">
          Owner: {careCase.assignee?.name ?? "Unassigned"} · Confirmation:{" "}
          {careCase.confirmationStatus} · Consultation:{" "}
          {careCase.consultedAt === null ? "pending" : "recorded"} · Treatment:{" "}
          {careCase.treatmentStartedAt === null ? "pending" : "started"}
        </Text>
        <Text size="sm" c="dimmed">
          Surveillance:{" "}
          {careCase.surveillancePlan === null
            ? "not set"
            : careCase.surveillancePlan}
        </Text>
      </Stack>
      {careCase.feedback === null ? (
        <Badge color="orange" variant="light">
          No patient feedback
        </Badge>
      ) : (
        <Badge
          color={careCase.feedback.understood ? "teal" : "orange"}
          variant="light"
        >
          Patient{" "}
          {careCase.feedback.understood ? "understood" : "did not understand"} ·
          confidence {careCase.feedback.confidence}/5
        </Badge>
      )}
    </Group>
  </Card>
);

export const CaseStateNotices = ({
  careCase,
}: {
  careCase: CaseDetail;
}): ReactNode => (
  <>
    {careCase.escalatedAt !== null && careCase.status !== "closed" ? (
      <Alert color="orange" title="Escalated">
        No mobile acknowledgment by the SLA window. Escalated{" "}
        {new Date(careCase.escalatedAt).toLocaleString()} — outreach is
        recommended.
      </Alert>
    ) : null}

    {careCase.status === "closed" ? (
      <Alert color="teal" title="Case closed">
        Signed off by {careCase.closedBy} on{" "}
        {careCase.closedAt === null
          ? "unknown"
          : new Date(careCase.closedAt).toLocaleString()}
        . Plan: {asSentence(careCase.closurePlan)} Evidence:{" "}
        {asSentence(careCase.closureEvidence)}
      </Alert>
    ) : null}
  </>
);
