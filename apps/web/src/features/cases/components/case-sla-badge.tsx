"use client";

import { Badge, Text } from "@mantine/core";
import {
  IconAlertTriangle,
  IconCircleCheck,
  IconClock,
} from "@tabler/icons-react";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { Pill } from "@/features/cases/components/case-badge-frame";

const formatDelta = (milliseconds: number): string => {
  const totalMinutes = Math.round(Math.abs(milliseconds) / 60_000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes}m`;
  return `${hours}h ${minutes}m`;
};

/* Severity windows, in hours, matching triage. */
const WINDOW_HOURS: Record<string, number> = {
  Urgent: 4,
  Actionable: 24,
  Routine: 72,
};

// SLA countdown shared by the queue and the case file. Colour follows the time
// remaining: neutral over 50%, actionable at 25–50%, urgent under 25%, and a
// solid urgent chip once breached. Ticks every minute.
export const SlaBadge = ({
  slaDueAt,
  status,
  severity,
}: {
  slaDueAt: string;
  status: string;
  severity?: string;
}): ReactNode => {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(timer);
  }, []);
  // A closed case has no clock left to run; showing one reads as a breach risk.
  if (status === "closed") return <Text c="dimmed">—</Text>;
  const due = new Date(slaDueAt).getTime();
  const remaining = due - now;
  if (remaining <= 0)
    return (
      <Pill tone="urgent" solid icon={<IconAlertTriangle size={13} />}>
        {`Breached ${formatDelta(remaining)} ago`}
      </Pill>
    );

  const windowHours = WINDOW_HOURS[severity ?? ""] ?? 24;
  const ratio = remaining / (windowHours * 3_600_000);
  if (ratio < 0.25)
    return (
      <Pill tone="urgent" icon={<IconClock size={13} stroke={1.75} />}>
        {`Due in ${formatDelta(remaining)}`}
      </Pill>
    );
  if (ratio < 0.5)
    return (
      <Pill tone="actionable" icon={<IconClock size={13} stroke={1.75} />}>
        {`Due in ${formatDelta(remaining)}`}
      </Pill>
    );
  return (
    <Badge
      variant="light"
      styles={{
        root: {
          backgroundColor: "#F1F5F9",
          color: "#334155",
          border: "none",
          textTransform: "none",
        },
      }}
    >
      {`Due in ${formatDelta(remaining)}`}
    </Badge>
  );
};

export const AckState = ({
  acknowledgedAt,
}: {
  acknowledgedAt: string | null;
}): ReactNode => {
  if (acknowledgedAt === null)
    return (
      <Pill tone="actionable" icon={<IconClock size={13} stroke={1.75} />}>
        Awaiting mobile ack
      </Pill>
    );
  return (
    <Pill tone="routine" icon={<IconCircleCheck size={13} stroke={1.75} />}>
      {`Ack ${new Date(acknowledgedAt).toLocaleString()}`}
    </Pill>
  );
};
