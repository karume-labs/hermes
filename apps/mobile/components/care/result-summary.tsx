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
    <Text variant="h3">{careCase.summaryPlainLanguage}</Text>
    <Text className="text-xs text-muted-foreground">
      Received {formatDateTime(careCase.createdAt)} · {careCase.clinicId}
    </Text>
    <View className="gap-2 rounded-xl border border-border bg-card p-4">
      <Text className="font-semibold">What this means</Text>
      <Text className="text-sm text-muted-foreground">
        {meaningForSeverity(careCase.severity)}
      </Text>
      <Text className="text-sm text-muted-foreground">
        {whyItMatters(careCase.severity)}
      </Text>
      <Text className="text-xs text-muted-foreground">
        This is a screening flag, not a diagnosis. A clinician confirms it.
      </Text>
    </View>
  </>
);
