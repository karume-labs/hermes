"use client";

import { Card, Group, Text } from "@mantine/core";
import type { ReactNode } from "react";

export const DelayReasonsCard = ({
  delayReasons,
}: {
  delayReasons: Record<string, number>;
}): ReactNode => {
  const entries = Object.entries(delayReasons);
  return (
    <Card
      radius="sm"
      p="xl"
      bg="brandChalk.0"
      bd="1px solid var(--mantine-color-brandChalk-3)"
    >
      <Text size="md" fw={700} mb="sm">
        Delay and drop-off reasons
      </Text>
      {entries.length === 0 ? (
        <Text size="sm" c="dimmed">
          No reasons recorded yet.
        </Text>
      ) : (
        <Group gap="lg">
          {entries.map(([reason, count]) => (
            <Text size="sm" key={reason}>
              {reason}: {count}
            </Text>
          ))}
        </Group>
      )}
    </Card>
  );
};
