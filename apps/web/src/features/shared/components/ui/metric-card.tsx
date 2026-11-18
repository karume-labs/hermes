"use client";

import { Badge, Card, Group, Text, Tooltip } from "@mantine/core";
import {
  IconArrowDownRight,
  IconArrowUpRight,
  IconInfoCircle,
} from "@tabler/icons-react";
import type { ReactNode } from "react";
import { IconTile } from "@/features/shared/components/ui/icon-tile";
import type { UiTone } from "@/features/shared/components/ui/tone";

type Emphasis = "none" | "attention" | "alert";

interface MetricCardProps {
  label: string;
  value: string | number;
  /** Small trailing unit, e.g. `h`, `%`, `cases`. */
  unit?: string;
  icon?: ReactNode;
  tone?: UiTone;
  hint?: string;
  /** Adds weight (never a second colour) when the number needs attention. */
  emphasis?: Emphasis;
  help?: string;
  trend?: "up" | "down";
}

const EMPHASIS_LABEL: Record<Emphasis, string> = {
  none: "",
  attention: "Needs a look",
  alert: "Overdue",
};

const Trend = ({ trend }: { trend: "up" | "down" }): ReactNode =>
  trend === "up" ? (
    <IconArrowUpRight size={16} stroke={2.2} aria-hidden />
  ) : (
    <IconArrowDownRight size={16} stroke={2.2} aria-hidden />
  );

export const MetricCard = ({
  label,
  value,
  unit,
  icon,
  tone = "neutral",
  hint,
  emphasis = "none",
  help,
  trend,
}: MetricCardProps): ReactNode => (
  <Card
    p="lg"
    bg="var(--hermes-surface)"
    bd="1px solid var(--hermes-line)"
    className="hermes-kpi"
  >
    <Group justify="space-between" align="flex-start" gap="sm" wrap="nowrap">
      <Group gap="sm" align="center" wrap="nowrap">
        {icon === undefined ? null : (
          <IconTile tone={tone} size={34} radius={10}>
            {icon}
          </IconTile>
        )}
        <Text
          size="xs"
          c="var(--hermes-ink-muted)"
          tt="uppercase"
          fw={700}
          lts="0.08em"
          lh={1.35}
        >
          {label}
          {help === undefined ? null : (
            <Tooltip label={help} withArrow multiline maw={240}>
              <IconInfoCircle
                size={12}
                style={{ marginLeft: 5, verticalAlign: "middle" }}
              />
            </Tooltip>
          )}
        </Text>
      </Group>
      {emphasis === "none" ? null : (
        <Badge
          size="xs"
          color="ink"
          variant={emphasis === "alert" ? "filled" : "light"}
          style={{ flexShrink: 0 }}
        >
          {EMPHASIS_LABEL[emphasis]}
        </Badge>
      )}
    </Group>

    <Group gap={6} align="baseline" mt="md" wrap="nowrap">
      <Text size="32px" fw={800} c="var(--hermes-ink)" lh={1}>
        {value}
      </Text>
      {unit === undefined ? null : (
        <Text size="sm" fw={700} c="var(--hermes-ink-muted)">
          {unit}
        </Text>
      )}
      {trend === undefined ? null : (
        <Text c="var(--hermes-ink-muted)" style={{ marginLeft: "auto" }}>
          <Trend trend={trend} />
        </Text>
      )}
    </Group>

    {hint === undefined ? null : (
      <Text size="xs" c="var(--hermes-ink-muted)" mt={8} lineClamp={2}>
        {hint}
      </Text>
    )}
  </Card>
);
