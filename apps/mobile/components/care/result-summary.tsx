import type { CareCase } from "@hermes/types";
import { View } from "react-native";
import { Chip } from "@/components/care/chip";
import { SeverityPill } from "@/components/care/severity-pill";
import { Text } from "@/components/ui/text";
import {
  formatDateTime,
  meaningForSeverity,
  statusLabel,
  whyItMatters,
} from "@/lib/case-format";

interface ResultSummaryProps {
  careCase: CareCase;
}

export const ResultSummary = ({ careCase }: ResultSummaryProps) => (
  <>
    <View className="flex-row flex-wrap items-center gap-2">
      <SeverityPill severity={careCase.severity} />
      <Chip
        label={statusLabel(careCase)}
        className="bg-secondary"
        textClassName="text-secondary-foreground"
      />
    </View>
    <Text variant="h3" className="text-[22px] leading-snug">
      {careCase.summaryPlainLanguage}
    </Text>
    <Text className="text-xs text-muted-foreground">
      Received {formatDateTime(careCase.createdAt)} · {careCase.clinicId}
    </Text>
    <View className="gap-2 rounded-xl border border-border bg-card p-4">
      <Text className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
        What this means
      </Text>
      <Text className="text-sm leading-relaxed text-foreground">
        {meaningForSeverity(careCase.severity)}
      </Text>
      <Text className="text-sm leading-relaxed text-muted-foreground">
        {whyItMatters(careCase.severity)}
      </Text>
      <View className="mt-1 rounded-lg bg-muted px-3 py-2">
        <Text className="text-xs leading-relaxed text-muted-foreground">
          This is a screening flag, not a diagnosis. A clinician confirms it.
        </Text>
      </View>
    </View>
  </>
);
