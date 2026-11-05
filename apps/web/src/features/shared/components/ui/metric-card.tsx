import { Card, Text, Tooltip } from "@mantine/core";
import { IconInfoCircle } from "@tabler/icons-react";
import type { ReactNode } from "react";

interface MetricCardProps {
  label: string;
  value: string | number;
  hint?: string;
  tone?: string;
  help?: string;
}

export const MetricCard = ({
  label,
  value,
  hint,
  tone = "brandSlate.9",
  help,
}: MetricCardProps): ReactNode => (
  <Card
    radius="sm"
    p="lg"
    bg="brandChalk.0"
    bd="1px solid var(--mantine-color-brandChalk-3)"
  >
    <Text size="sm" c="brandSlate.5" tt="uppercase" fw={700} lts="0.1em">
      {label}
      {help === undefined ? null : (
        <Tooltip label={help} withArrow multiline maw={240}>
          <IconInfoCircle
            size={13}
            style={{ marginLeft: 6, verticalAlign: "middle" }}
          />
        </Tooltip>
      )}
    </Text>
    <Text size="28px" fw={800} mt={6} c={tone} lh={1.1}>
      {value}
    </Text>
    {hint === undefined ? null : (
      <Text size="xs" c="dimmed" mt={6}>
        {hint}
      </Text>
    )}
  </Card>
);
