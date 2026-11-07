import type { CareCase } from "@hermes/types";
import { CheckCircle2 } from "lucide-react-native";
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

export const ResultSummary = ({ careCase }: ResultSummaryProps) => {
  const closed = careCase.status === "closed";
  return (
    <View className="gap-3 px-4">
      <View className="flex-row flex-wrap items-center gap-2">
        {closed ? (
          <Chip
            label="Reviewed"
            tone="quiet"
            icon={<CheckCircle2 size={12} color="currentColor" />}
          />
        ) : (
          <SeverityPill severity={careCase.severity} />
        )}
        {closed ? null : <Chip label={statusLabel(careCase)} tone="soft" />}
      </View>

      <Text className="text-[24px] font-bold leading-[31px] tracking-[-0.01em]">
        {careCase.summaryPlainLanguage}
      </Text>
      <Text className="text-[12px] text-muted-foreground">
        Received {formatDateTime(careCase.createdAt)} · {careCase.clinicId}
      </Text>

      <View className="gap-2 border-t border-border/70 pt-3">
        <Text className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
          What this means
        </Text>
        <Text className="text-[15px] leading-[23px] text-foreground">
          {meaningForSeverity(careCase.severity)}
        </Text>
        <Text className="text-[15px] leading-[23px] text-muted-foreground">
          {whyItMatters(careCase.severity)}
        </Text>
        <Text className="text-[12px] leading-[17px] text-muted-foreground">
          This is a screening flag, not a diagnosis. A clinician confirms it.
        </Text>
      </View>
    </View>
  );
};
