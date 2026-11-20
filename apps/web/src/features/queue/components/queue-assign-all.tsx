"use client";

import { Button, Group, Text } from "@mantine/core";
import type { ReactNode } from "react";
import { authClient } from "@/features/auth/services/client";
import { useAssignCase } from "@/features/cases/services/mutations-case";

interface QueueCaseRef {
  id: string;
  assignedToId: string | null;
}

interface QueueAssignAllProps {
  cases: QueueCaseRef[];
  unassigned: number;
  canOwn: boolean;
}

export const QueueAssignAll = ({
  cases,
  unassigned,
  canOwn,
}: QueueAssignAllProps): ReactNode => {
  const { data: session } = authClient.useSession();
  const assign = useAssignCase();

  if (!canOwn) return null;

  const takeAll = (): void => {
    const userId = session?.user.id;
    if (userId === undefined) return;
    for (const item of cases) {
      if (item.assignedToId === null) {
        assign.mutate({ caseId: item.id, assignedToId: userId });
      }
    }
  };

  return (
    <Group justify="flex-end">
      {assign.isError ? (
        <Text size="xs" c="var(--hermes-urgent-ink)">
          Those cases could not be assigned. Try one at a time.
        </Text>
      ) : null}
      <Button
        variant="subtle"
        size="xs"
        onClick={takeAll}
        disabled={unassigned === 0 || assign.isPending}
      >
        {unassigned === 0
          ? "Every case has an owner"
          : `Take the ${unassigned} unassigned case${unassigned === 1 ? "" : "s"}`}
      </Button>
    </Group>
  );
};
