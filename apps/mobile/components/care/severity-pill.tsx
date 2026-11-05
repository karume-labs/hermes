import type { Severity } from "@hermes/types";
import { Chip } from "@/components/care/chip";
import { severityLabel } from "@/lib/case-format";

const TONE = {
  Urgent: { chip: "bg-red-100", text: "text-red-700" },
  Actionable: { chip: "bg-amber-100", text: "text-amber-800" },
  Routine: { chip: "bg-slate-100", text: "text-slate-700" },
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
