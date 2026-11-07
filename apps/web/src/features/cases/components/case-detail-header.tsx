"use client";

import type { CaseDetail } from "@hermes/types";
import { Anchor, Group, Stack, Text } from "@mantine/core";
import Link from "next/link";
import type { ReactNode } from "react";
import { SeverityBadge } from "@/features/cases/components/case-severity-badge";
import { AckState, SlaBadge } from "@/features/cases/components/case-sla-badge";
import { StatusBadge } from "@/features/cases/components/case-status-badge";
import { PageHeader } from "@/features/shared/components/layout/page-header";

export const CaseDetailHeader = ({
  careCase,
}: {
  careCase: CaseDetail;
}): ReactNode => (
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
);
