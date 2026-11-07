"use client";

import { Text } from "@mantine/core";
import {
  IconAlertTriangle,
  IconCircleCheck,
  IconClock,
} from "@tabler/icons-react";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { Pill } from "@/features/shared/components/ui/pill";

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

const WINDOW_COPY: Record<string, string> = {
  Urgent: "4-hour window for urgent results",
  Actionable: "24-hour window for actionable results",
  Routine: "72-hour window for routine results",
};

// Time remaining drives the badge weight, not a new colour: filled once the
// window is gone, light in the last quarter, outline above that. Ticks a minute.
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
  // A closed case has no clock left to run; showing one reads as a risk.
  if (status === "closed") return <Text c="dimmed">—</Text>;

  const due = new Date(slaDueAt).getTime();
  const remaining = due - now;
  const windowCopy = WINDOW_COPY[severity ?? ""] ?? "the response window";

  if (remaining <= 0)
    return (
      <Pill
        tone="urgent"
        icon={<IconAlertTriangle size={13} />}
        description={`The ${windowCopy} has passed without the patient confirming the result.`}
      >
        {`Overdue by ${formatDelta(remaining)}`}
      </Pill>
    );

  const windowHours = WINDOW_HOURS[severity ?? ""] ?? 24;
  const ratio = remaining / (windowHours * 3_600_000);
  if (ratio < 0.25)
    return (
      <Pill
        tone="actionable"
        icon={<IconClock size={13} stroke={1.75} />}
        description={`Less than a quarter of ${windowCopy} is left.`}
      >
        {`${formatDelta(remaining)} left`}
      </Pill>
    );

  return (
    <Pill
      tone="routine"
      icon={<IconCircleCheck size={13} stroke={1.75} />}
      description={`Countdown inside ${windowCopy}.`}
    >
      {`${formatDelta(remaining)} left`}
    </Pill>
  );
};

export const AckState = ({
  acknowledgedAt,
}: {
  acknowledgedAt: string | null;
}): ReactNode => {
  if (acknowledgedAt === null)
    return (
      <Pill
        tone="actionable"
        icon={<IconClock size={13} stroke={1.75} />}
        description="The patient has not opened this result in the app yet."
      >
        Waiting on patient
      </Pill>
    );
  return (
    <Pill
      tone="routine"
      icon={<IconCircleCheck size={13} stroke={1.75} />}
      description="The patient opened and confirmed this result."
    >
      {`Seen ${new Date(acknowledgedAt).toLocaleDateString()}`}
    </Pill>
  );
};
