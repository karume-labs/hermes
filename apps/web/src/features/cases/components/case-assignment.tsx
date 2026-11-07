"use client";

import type { CaseDetail } from "@hermes/types";
import { Alert, Button, Card, Group, Stack, Text, Title } from "@mantine/core";
import type { ReactNode } from "react";
import { useState } from "react";
import { useAssignCase } from "@/features/cases/services/mutations-case";
import { useCareTeam } from "@/features/cases/services/queries";
import { Pill } from "@/features/shared/components/ui/pill";
import { errorMessage } from "@/features/shared/utils/form-errors";

export const CaseAssignment = ({
  detail,
}: {
  detail: CaseDetail;
}): ReactNode => {
  const team = useCareTeam();
  const assign = useAssignCase();
  const [selected, setSelected] = useState<string | null>(detail.assignedToId);
  const members = (team.data ?? []).filter((member) => member.role !== "admin");

  return (
    <Card withBorder radius="md" p="lg">
      <Group justify="space-between" mb="sm">
        <Title order={3}>Accountable owner</Title>
        {detail.assignee === null ? (
          <Pill
            tone="actionable"
            description="Nobody is responsible for the next step."
          >
            Unassigned
          </Pill>
        ) : (
          <Pill tone="routine">
            {detail.assignee.name} · {detail.assignee.role}
          </Pill>
        )}
      </Group>
      <Text size="sm" c="dimmed" mb="sm">
        Every transition should leave one named person responsible for the next
        step.
      </Text>
      {assign.isError ? (
        <Alert color="red" mb="sm">
          {errorMessage(assign.error)}
        </Alert>
      ) : null}
      <Stack gap="sm">
        {members.map((member) => (
          <Group key={member.id} justify="space-between">
            <Text size="sm">
              {member.name} · {member.role}
            </Text>
            <Button
              size="xs"
              variant={selected === member.id ? "filled" : "light"}
              loading={assign.isPending}
              onClick={() => {
                setSelected(member.id);
                assign.mutate({ caseId: detail.id, assignedToId: member.id });
              }}
            >
              {selected === member.id ? "Owner" : "Assign"}
            </Button>
          </Group>
        ))}
        {detail.assignedToId === null ? null : (
          <Button
            size="xs"
            variant="subtle"
            color="orange"
            onClick={() => {
              setSelected(null);
              assign.mutate({ caseId: detail.id, assignedToId: null });
            }}
          >
            Clear owner
          </Button>
        )}
        {members.length === 0 ? (
          <Text size="sm" c="dimmed">
            No care-team accounts are available yet.
          </Text>
        ) : null}
      </Stack>
    </Card>
  );
};
