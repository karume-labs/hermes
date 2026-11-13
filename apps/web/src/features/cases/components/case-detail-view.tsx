"use client";

import { Alert, Badge, Button, Stack, Tabs, Text } from "@mantine/core";
import Link from "next/link";
import type { ReactNode } from "react";
import { authClient } from "@/features/auth/services/client";
import { CaseActions } from "@/features/cases/components/case-actions";
import { CaseAttachments } from "@/features/cases/components/case-attachments";
import { CaseAudit } from "@/features/cases/components/case-audit";
import { CaseConsultNotes } from "@/features/cases/components/case-consult-notes";
import { CaseDetailHeader } from "@/features/cases/components/case-detail-header";
import { CaseMessages } from "@/features/cases/components/case-messages";
import {
  CareContinuityCard,
  CaseStateNotices,
  CaseSummaryCard,
} from "@/features/cases/components/case-status-cards";
import { CaseTeam } from "@/features/cases/components/case-team";
import { useCaseDetail } from "@/features/cases/services/queries";

interface CaseDetailViewProps {
  caseId: string;
}

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
      <CaseDetailHeader careCase={careCase} />

      <CaseSummaryCard careCase={careCase} />

      <CareContinuityCard careCase={careCase} />

      <CaseStateNotices careCase={careCase} />

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
          <Stack gap="md">
            <CaseTeam detail={careCase} />
            <CaseActions detail={careCase} />
          </Stack>
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
