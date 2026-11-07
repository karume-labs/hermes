import type { Severity } from "@hermes/types";
import { AlertTriangle, CheckCircle2, Clock } from "lucide-react-native";
import type { ReactNode } from "react";
import { Chip, type ChipTone } from "@/components/care/chip";
import { severityLabel } from "@/lib/case-format";

/**
 * Severity always carries an icon and a text label, never colour alone. Weight
 * does the ranking: urgent is solid ink, actionable is a warm tint, routine is
 * a quiet outline.
 */
const TONE: Record<Severity, { tone: ChipTone; icon: ReactNode }> = {
  Urgent: {
    tone: "strong",
    icon: <AlertTriangle size={12} color="currentColor" />,
  },
  Actionable: {
    tone: "soft",
    icon: <Clock size={12} color="currentColor" />,
  },
  Routine: {
    tone: "quiet",
    icon: <CheckCircle2 size={12} color="currentColor" />,
  },
};

interface SeverityPillProps {
  severity: Severity;
}

export const SeverityPill = ({ severity }: SeverityPillProps) => {
  const entry = TONE[severity];
  return (
    <Chip label={severityLabel(severity)} tone={entry.tone} icon={entry.icon} />
  );
};
