"use client";

import type { CaseDetail } from "@hermes/types";
import { Badge, Button, Card, Group, Stack, Text, Title } from "@mantine/core";
import type { ReactNode } from "react";
import { useCompleteTask } from "@/features/cases/services/mutations-outcome";

export const CaseOpenWorkCard = ({
  detail,
}: {
  detail: CaseDetail;
}): ReactNode => {
  const completeTask = useCompleteTask();

  return (
    <Card withBorder radius="md" p="lg">
      <Group justify="space-between" mb="sm">
        <Title order={3}>Open work</Title>
        <Badge variant="light">{detail.tasks.length}</Badge>
      </Group>
      <Stack gap="sm">
        {detail.tasks.map((task) => (
          <Group key={task.id} justify="space-between" align="flex-start">
            <Stack gap={0}>
              <Text size="sm" fw={600}>
                {task.title}
              </Text>
              <Text size="xs" c="dimmed">
                {task.kind} · {task.detail ?? "No detail"}
              </Text>
            </Stack>
            <Button
              size="xs"
              variant="light"
              loading={completeTask.isPending}
              onClick={() => completeTask.mutate(task.id)}
            >
              Done
            </Button>
          </Group>
        ))}
        {detail.tasks.length === 0 ? (
          <Text size="sm" c="dimmed">
            No open escalation or referral tasks.
          </Text>
        ) : null}
      </Stack>
    </Card>
  );
};
