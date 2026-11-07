"use client";

import {
  IconAlertTriangle,
  IconCircleCheck,
  IconClock,
  IconInfoCircle,
} from "@tabler/icons-react";
import type { ReactNode } from "react";
import { Pill, type Tone } from "@/features/cases/components/case-badge-frame";

const UNKNOWN_STATUS: { label: string; tone: Tone } = {
  label: "",
  tone: "info",
};

const STATUS: Partial<Record<string, { label: string; tone: Tone }>> = {
  received: { label: "Result received", tone: "info" },
  triaged: { label: "Triaged", tone: "info" },
  notified: { label: "Outreach in progress", tone: "actionable" },
  acknowledged: { label: "Acknowledged on mobile", tone: "routine" },
  appointment_booked: { label: "Appointment booked", tone: "routine" },
  referred: { label: "Referred", tone: "info" },
  escalated: { label: "Escalated", tone: "urgent" },
  closed: { label: "Case closed", tone: "routine" },
};

export const StatusBadge = ({ status }: { status: string }): ReactNode => {
  const entry = STATUS[status] ?? { ...UNKNOWN_STATUS, label: status };
  const icon =
    entry.tone === "urgent" ? (
      <IconAlertTriangle size={13} stroke={1.75} />
    ) : entry.tone === "routine" ? (
      <IconCircleCheck size={13} stroke={1.75} />
    ) : entry.tone === "actionable" ? (
      <IconClock size={13} stroke={1.75} />
    ) : (
      <IconInfoCircle size={13} stroke={1.75} />
    );
  return (
    <Pill tone={entry.tone} icon={icon}>
      {entry.label}
    </Pill>
  );
};
