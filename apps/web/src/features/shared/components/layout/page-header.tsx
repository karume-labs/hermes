import { Group, Stack, Text, Title } from "@mantine/core";
import type { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}

export const PageHeader = ({
  title,
  subtitle,
  actions,
}: PageHeaderProps): ReactNode => (
  <Group justify="space-between" align="flex-start" wrap="wrap" gap="sm">
    <Stack gap={4}>
      <Title order={2}>{title}</Title>
      {subtitle === undefined ? null : (
        <Text size="sm" c="dimmed" maw={640}>
          {subtitle}
        </Text>
      )}
    </Stack>
    {actions}
  </Group>
);
