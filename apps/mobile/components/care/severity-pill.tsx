import type { Severity } from "@hermes/types";
import { AlertTriangle, CheckCircle2, Clock } from "lucide-react-native";
import type { ReactNode } from "react";
import { Chip } from "@/components/care/chip";
import { severityLabel } from "@/lib/case-format";

/**
 * Severity always carries an icon and a text label, never colour alone. Pairs
 * come from the design system, not from the primary action colour.
 */
const TONE: Record<Severity, { chip: string; text: string; icon: ReactNode }> =
  {
    Urgent: {
      chip: "bg-urgent-fill",
      text: "text-urgent",
      icon: <AlertTriangle size={12} color="#991B1B" />,
    },
    Actionable: {
      chip: "bg-warning-fill",
      text: "text-warning",
      icon: <Clock size={12} color="#92400E" />,
    },
    Routine: {
      chip: "bg-success-fill",
      text: "text-success",
      icon: <CheckCircle2 size={12} color="#166534" />,
    },
  };

interface SeverityPillProps {
  severity: Severity;
}

export const SeverityPill = ({ severity }: SeverityPillProps) => (
  <Chip
    label={severityLabel(severity)}
    className={TONE[severity].chip}
    textClassName={TONE[severity].text}
    icon={TONE[severity].icon}
  />
);
