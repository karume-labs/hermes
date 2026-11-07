"use client";

import {
  IconAlertTriangle,
  IconCircleCheck,
  IconClock,
} from "@tabler/icons-react";
import type { ReactNode } from "react";
import { Pill, type Tone } from "@/features/shared/components/ui/pill";

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

const SEVERITY_DESCRIPTION: Record<string, string> = {
  Urgent: "Needs a clinician within 4 hours of the result arriving.",
  Actionable: "Needs a decision within 24 hours.",
  Routine: "Can wait up to 72 hours for the next step.",
};

export const SeverityBadge = ({
  severity,
}: {
  severity: string;
}): ReactNode => (
  <Pill
    tone={severityTone(severity)}
    icon={severityIcon(severity)}
    description={SEVERITY_DESCRIPTION[severity]}
  >
    {severity}
  </Pill>
);
