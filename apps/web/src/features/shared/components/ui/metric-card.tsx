import { Badge, Card, Group, Text, Tooltip } from "@mantine/core";
import { IconInfoCircle } from "@tabler/icons-react";
import type { ReactNode } from "react";

type Emphasis = "none" | "attention" | "alert";

interface MetricCardProps {
  label: string;
  value: string | number;
  hint?: string;
  /** Adds weight (never a second colour) when the number needs attention. */
  emphasis?: Emphasis;
  help?: string;
}

const EMPHASIS_LABEL: Record<Emphasis, string> = {
  none: "",
  attention: "Needs a look",
  alert: "Overdue",
};

export const MetricCard = ({
  label,
  value,
  hint,
  emphasis = "none",
  help,
}: MetricCardProps): ReactNode => (
  <Card
    radius="lg"
    p="lg"
    bg="var(--hermes-surface)"
    bd="1px solid var(--hermes-line)"
  >
    <Group justify="space-between" align="flex-start" gap="xs">
      <Text
        size="xs"
        c="var(--hermes-ink-muted)"
        tt="uppercase"
        fw={700}
        lts="0.1em"
      >
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
      {emphasis === "none" ? null : (
        <Badge
          size="xs"
          color="ink"
          variant={emphasis === "alert" ? "filled" : "light"}
        >
          {EMPHASIS_LABEL[emphasis]}
        </Badge>
      )}
    </Group>
    <Text size="30px" fw={800} mt={8} c="var(--hermes-ink)" lh={1.1}>
      {value}
    </Text>
    {hint === undefined ? null : (
      <Text size="xs" c="dimmed" mt={6}>
        {hint}
      </Text>
    )}
  </Card>
);
