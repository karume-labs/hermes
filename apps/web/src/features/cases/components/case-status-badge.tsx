"use client";

import {
  IconAlertTriangle,
  IconCircleCheck,
  IconClock,
  IconInfoCircle,
} from "@tabler/icons-react";
import type { ReactNode } from "react";
import { Pill, type Tone } from "@/features/shared/components/ui/pill";

interface StatusEntry {
  label: string;
  tone: Tone;
  description: string;
}

const STATUS: Partial<Record<string, StatusEntry>> = {
  received: {
    label: "Result received",
    tone: "info",
    description: "The lab result has arrived and is waiting to be triaged.",
  },
  triaged: {
    label: "Triaged",
    tone: "info",
    description: "Severity is set. The patient has not been contacted yet.",
  },
  notified: {
    label: "Message sent",
    tone: "actionable",
    description:
      "The patient has been messaged and we are waiting for a reply.",
  },
  acknowledged: {
    label: "Patient confirmed",
    tone: "routine",
    description: "The patient opened the result in the app and confirmed it.",
  },
  appointment_booked: {
    label: "Visit booked",
    tone: "routine",
    description: "A visit is on the clinic schedule.",
  },
  referred: {
    label: "Referred",
    tone: "info",
    description: "Another clinic is handling the next step.",
  },
  escalated: {
    label: "Escalated",
    tone: "urgent",
    description:
      "A clinician picked this up because the time window was closing.",
  },
  closed: {
    label: "Closed",
    tone: "routine",
    description: "The loop is closed. Nothing else is needed.",
  },
};

export const StatusBadge = ({ status }: { status: string }): ReactNode => {
  const entry = STATUS[status];
  const tone = entry === undefined ? "info" : entry.tone;
  const icon =
    tone === "urgent" ? (
      <IconAlertTriangle size={13} stroke={1.75} />
    ) : tone === "routine" ? (
      <IconCircleCheck size={13} stroke={1.75} />
    ) : tone === "actionable" ? (
      <IconClock size={13} stroke={1.75} />
    ) : (
      <IconInfoCircle size={13} stroke={1.75} />
    );

  return (
    <Pill
      tone={tone}
      icon={icon}
      description={entry === undefined ? undefined : entry.description}
    >
      {entry === undefined ? status : entry.label}
    </Pill>
  );
};
