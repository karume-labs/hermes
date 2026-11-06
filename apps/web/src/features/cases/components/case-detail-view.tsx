"use client";

import {
  Alert,
  Anchor,
  Badge,
  Button,
  Card,
  Group,
  Stack,
  Tabs,
  Text,
} from "@mantine/core";
import Link from "next/link";
import type { ReactNode } from "react";
import { authClient } from "@/features/auth/services/client";
import { CaseActions } from "@/features/cases/components/case-actions";
import { CaseAttachments } from "@/features/cases/components/case-attachments";
import { CaseAudit } from "@/features/cases/components/case-audit";
import {
  AckState,
  SeverityBadge,
  SlaBadge,
  StatusBadge,
} from "@/features/cases/components/case-badges";
import { CaseConsultNotes } from "@/features/cases/components/case-consult-notes";
import { CaseMessages } from "@/features/cases/components/case-messages";
import { useCaseDetail } from "@/features/cases/services/queries";
import { PageHeader } from "@/features/shared/components/layout/page-header";

interface CaseDetailViewProps {
  caseId: string;
}

const CARD_STYLE = "1px solid var(--mantine-color-brandChalk-3)";

// Clinical free text often ends in its own full stop; keep exactly one.
const asSentence = (value: string | null): string => {
  if (value === null || value.trim() === "") return "not recorded";
  return `${value.trim().replace(/\.+$/, "")}.`;
};

export const CaseDetailView = ({ caseId }: CaseDetailViewProps): ReactNode => {
  const detail = useCaseDetail(caseId);
  const { data: session } = authClient.useSession();
  // The internal consult thread is clinical: coordinators never receive or
  // render it, matching the API restriction.
  const canSeeConsult =
    session?.user.role === "clinician" || session?.user.role === "admin";

  if (detail.isLoading) return <Text c="dimmed">Loading case…</Text>;
  if (detail.isError || detail.data === undefined)
    return (
      <Stack>
        <Alert color="red" title="Case not found">
          This case does not exist or the API is offline.
        </Alert>
        <Button component={Link} href="/queue" variant="light" w="fit-content">
          Back to queue
        </Button>
      </Stack>
    );

  const careCase = detail.data;

  return (
    <Stack gap="xl" maw={1100}>
      <Stack gap="xs">
        <Text size="xs" c="dimmed">
          <Anchor component={Link} href="/queue" size="xs" c="dimmed">
            Queue
          </Anchor>{" "}
          / {careCase.id.slice(0, 8)}
        </Text>
        <PageHeader
          title="Case file"
          subtitle={`${careCase.patientId} · ${careCase.clinicId}`}
          actions={
            <Group gap="xs">
              <SeverityBadge severity={careCase.severity} />
              <StatusBadge status={careCase.status} />
              <SlaBadge
                slaDueAt={careCase.slaDueAt}
                status={careCase.status}
                severity={careCase.severity}
              />
              <AckState acknowledgedAt={careCase.acknowledgedAt} />
            </Group>
          }
        />
      </Stack>

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

      <Card radius="sm" p="lg" bd={CARD_STYLE}>
        <Group justify="space-between" align="flex-start">
          <Stack gap={2}>
            <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
              Care continuity
            </Text>
            <Text size="sm">
              Owner: {careCase.assignee?.name ?? "Unassigned"} · Confirmation:{" "}
              {careCase.confirmationStatus} · Consultation:{" "}
              {careCase.consultedAt === null ? "pending" : "recorded"} ·
              Treatment:{" "}
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
              {careCase.feedback.understood
                ? "understood"
                : "did not understand"}{" "}
              · confidence {careCase.feedback.confidence}/5
            </Badge>
          )}
        </Group>
      </Card>

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

      <Tabs defaultValue="actions" keepMounted={false}>
        <Tabs.List>
          <Tabs.Tab value="actions">Consult &amp; closure</Tabs.Tab>
          <Tabs.Tab value="messages">
            Messages
            <Badge ml={6} size="xs" variant="light">
              {careCase.messages.length}
            </Badge>
          </Tabs.Tab>
          {canSeeConsult ? (
            <Tabs.Tab value="consult">
              Clinical consult
              <Badge ml={6} size="xs" variant="light">
                {careCase.consultNotes.length}
              </Badge>
            </Tabs.Tab>
          ) : null}
          <Tabs.Tab value="documents">
            Documents
            <Badge ml={6} size="xs" variant="light">
              {careCase.attachments.length}
            </Badge>
          </Tabs.Tab>
          <Tabs.Tab value="audit">Audit trail</Tabs.Tab>
        </Tabs.List>
        <Tabs.Panel value="actions" pt="md">
          <CaseActions detail={careCase} />
        </Tabs.Panel>
        <Tabs.Panel value="messages" pt="md">
          <CaseMessages detail={careCase} />
        </Tabs.Panel>
        {canSeeConsult ? (
          <Tabs.Panel value="consult" pt="md">
            <CaseConsultNotes detail={careCase} />
          </Tabs.Panel>
        ) : null}
        <Tabs.Panel value="documents" pt="md">
          <CaseAttachments detail={careCase} />
        </Tabs.Panel>
        <Tabs.Panel value="audit" pt="md">
          <CaseAudit detail={careCase} />
        </Tabs.Panel>
      </Tabs>
    </Stack>
  );
};
