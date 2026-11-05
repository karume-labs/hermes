import type { Severity } from "@hermes/types";
import { Chip } from "@/components/care/chip";
import { severityLabel } from "@/lib/case-format";

const TONE = {
  Urgent: { chip: "bg-destructive/10", text: "text-urgent" },
  Actionable: { chip: "bg-warning/10", text: "text-warning" },
  Routine: { chip: "bg-secondary", text: "text-secondary-foreground" },
} as const;

interface SeverityPillProps {
  severity: Severity;
}

export const SeverityPill = ({ severity }: SeverityPillProps) => (
  <Chip
    label={severityLabel(severity)}
    className={TONE[severity].chip}
    textClassName={TONE[severity].text}
  />
);
