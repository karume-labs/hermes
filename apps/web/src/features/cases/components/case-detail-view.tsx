"use client";

import {
  Alert,
  Badge,
  Button,
  Card,
  Group,
  Stack,
  Tabs,
  Text,
  Title,
} from "@mantine/core";
import Link from "next/link";
import type { ReactNode } from "react";
import { CaseActions } from "@/features/cases/components/case-actions";
import { CaseAudit } from "@/features/cases/components/case-audit";
import {
  AckState,
  SeverityBadge,
  SlaBadge,
  StatusBadge,
} from "@/features/cases/components/case-badges";
import { CaseMessages } from "@/features/cases/components/case-messages";
import { useCaseDetail } from "@/features/cases/services/queries";

interface CaseDetailViewProps {
  caseId: string;
}

// Clinical free text often ends in its own full stop; keep exactly one.
const asSentence = (value: string | null): string => {
  if (value === null || value.trim() === "") return "not recorded";
  return `${value.trim().replace(/\.+$/, "")}.`;
};

export const CaseDetailView = ({ caseId }: CaseDetailViewProps): ReactNode => {
  const detail = useCaseDetail(caseId);

  if (detail.isLoading) return <Text p={24}>Loading case…</Text>;
  if (detail.isError || detail.data === undefined)
    return (
      <Stack p={24}>
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
    <Stack p={24} maw={1100} mx="auto" gap="lg">
      <Group justify="space-between">
        <div>
          <Text size="xs" c="dimmed">
            <Link href="/queue">Queue</Link> / {careCase.id.slice(0, 8)}
          </Text>
          <Title order={1}>Case file</Title>
          <Text c="dimmed" size="sm">
            {careCase.patientId} · {careCase.clinicId}
          </Text>
        </div>
        <Group gap="xs">
          <SeverityBadge severity={careCase.severity} />
          <StatusBadge status={careCase.status} />
          <SlaBadge slaDueAt={careCase.slaDueAt} status={careCase.status} />
          <AckState acknowledgedAt={careCase.acknowledgedAt} />
        </Group>
      </Group>

      <Card withBorder>
        <Text size="xs" c="dimmed" mb={4}>
          Plain-language summary sent to the patient
        </Text>
        <Text>{careCase.summaryPlainLanguage}</Text>
        <Group mt="sm" gap="lg">
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

      {careCase.escalatedAt !== null && careCase.status !== "closed" && (
        <Alert color="orange" title="Escalated">
          No mobile acknowledgment by the SLA window. Escalated{" "}
          {new Date(careCase.escalatedAt).toLocaleString()} — outreach is
          recommended.
        </Alert>
      )}

      {careCase.status === "closed" && (
        <Alert color="teal" title="Case closed">
          Signed off by {careCase.closedBy} on{" "}
          {careCase.closedAt === null
            ? "unknown"
            : new Date(careCase.closedAt).toLocaleString()}
          . Plan: {asSentence(careCase.closurePlan)} Evidence:{" "}
          {asSentence(careCase.closureEvidence)}
        </Alert>
      )}

      <Tabs defaultValue="actions" keepMounted={false}>
        <Tabs.List>
          <Tabs.Tab value="actions">Consult &amp; closure</Tabs.Tab>
          <Tabs.Tab value="messages">
            Messages
            <Badge ml={6} size="xs" variant="light">
              {careCase.messages.length}
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
        <Tabs.Panel value="audit" pt="md">
          <CaseAudit detail={careCase} />
        </Tabs.Panel>
      </Tabs>
    </Stack>
  );
};
