"use client";

import { Badge, Text } from "@mantine/core";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";

export type Severity = "Routine" | "Actionable" | "Urgent";

const severityColor = (severity: string): string => {
  if (severity === "Urgent") return "red";
  if (severity === "Actionable") return "orange";
  return "gray";
};

const statusColor = (status: string): string => {
  if (status === "closed") return "teal";
  if (status === "escalated") return "red";
  if (status === "referred") return "violet";
  if (status === "appointment_booked") return "blue";
  if (status === "acknowledged") return "cyan";
  return "yellow";
};

export const SeverityBadge = ({
  severity,
}: {
  severity: string;
}): ReactNode => (
  <Badge color={severityColor(severity)} variant="light">
    {severity}
  </Badge>
);

export const StatusBadge = ({ status }: { status: string }): ReactNode => (
  <Badge color={statusColor(status)} variant="light">
    {status.replaceAll("_", " ")}
  </Badge>
);

const formatDelta = (milliseconds: number): string => {
  const totalMinutes = Math.round(Math.abs(milliseconds) / 60_000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes}m`;
  return `${hours}h ${minutes}m`;
};

// SLA countdown shared by the queue and the case file. It re-renders on a
// one-minute tick so a stale tab does not keep showing expired urgency.
export const SlaBadge = ({
  slaDueAt,
  status,
}: {
  slaDueAt: string;
  status: string;
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
      <Badge color="red" variant="filled">
        breached {formatDelta(remaining)} ago
      </Badge>
    );
  return (
    <Badge
      color={remaining < 6 * 3_600_000 ? "orange" : "teal"}
      variant="light"
    >
      {formatDelta(remaining)} left
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
      <Badge color="yellow" variant="dot">
        pending mobile ack
      </Badge>
    );
  return (
    <Badge color="teal" variant="dot">
      ack {new Date(acknowledgedAt).toLocaleString()}
    </Badge>
  );
};
