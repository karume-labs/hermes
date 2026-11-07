"use client";

import {
  IconAlertTriangle,
  IconCircleCheck,
  IconClock,
} from "@tabler/icons-react";
import type { ReactNode } from "react";
import { Pill, type Tone } from "@/features/cases/components/case-badge-frame";

export const severityTone = (severity: string): Tone => {
  if (severity === "Urgent") return "urgent";
  if (severity === "Actionable") return "actionable";
  return "routine";
};

/* One fixed icon per severity — colour is never the only signal. */
const severityIcon = (severity: string): ReactNode => {
  if (severity === "Urgent")
    return <IconAlertTriangle size={13} stroke={1.75} />;
  if (severity === "Actionable") return <IconClock size={13} stroke={1.75} />;
  return <IconCircleCheck size={13} stroke={1.75} />;
};

export const SeverityBadge = ({
  severity,
}: {
  severity: string;
}): ReactNode => (
  <Pill tone={severityTone(severity)} icon={severityIcon(severity)}>
    {severity}
  </Pill>
);
