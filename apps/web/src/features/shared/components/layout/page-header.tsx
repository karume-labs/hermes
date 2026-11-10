import { Group, Stack, Text, Title } from "@mantine/core";
import type { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  actions?: ReactNode;
}

export const PageHeader = ({
  title,
  subtitle,
  eyebrow,
  actions,
}: PageHeaderProps): ReactNode => (
  <Group justify="space-between" align="flex-start" wrap="wrap" gap="md">
    <Stack gap={4}>
      {eyebrow === undefined ? null : (
        <Text
          size="xs"
          fw={700}
          c="var(--hermes-ink-muted)"
          tt="uppercase"
          lts="0.14em"
        >
          {eyebrow}
        </Text>
      )}
      <Title order={1} fw={900} c="var(--hermes-ink)" lts="0.05em">
        {title}
      </Title>
      {subtitle === undefined ? null : (
        <Text c="dimmed" size="md" maw={720}>
          {subtitle}
        </Text>
      )}
    </Stack>
    {actions}
  </Group>
);
