"use client";

import type { CaseDetail } from "@hermes/types";
import { Anchor, Group, Stack, Text } from "@mantine/core";
import { IconFileText } from "@tabler/icons-react";
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
      /{" "}
      <Text span ff="monospace" size="xs">
        {careCase.id.slice(0, 8).toUpperCase()}
      </Text>
    </Text>
    <PageHeader
      title="Case file"
      icon={<IconFileText size={24} />}
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
