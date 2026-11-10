import type { PatientCase } from "@hermes/types";
import { CheckCircle2, ChevronRight } from "lucide-react-native";
import { Pressable, View } from "react-native";
import { Chip } from "@/components/care/chip";
import { SeverityPill } from "@/components/care/severity-pill";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { journeyLabel, statusLabel } from "@/lib/case-format";
import { cn } from "@/lib/utils";

interface ResultRowProps {
  item: PatientCase;
  first: boolean;
  onPress: () => void;
}

export const ResultRow = ({ item, first, onPress }: ResultRowProps) => (
  <Pressable
    accessibilityRole="button"
    android_ripple={{ color: "rgba(148,163,184,0.14)" }}
    onPress={onPress}
    className={cn(
      "flex-row items-start gap-3 bg-card px-4 py-3.5 active:bg-secondary/60",
      first ? null : "border-t border-border/70",
    )}
  >
    <View className="flex-1 gap-1.5">
      <View className="flex-row items-center gap-2">
        {item.careCase.status === "closed" ? (
          <Chip
            label="Reviewed"
            tone="quiet"
            icon={<CheckCircle2 size={12} color="currentColor" />}
          />
        ) : (
          <SeverityPill severity={item.careCase.severity} />
        )}
        {item.careCase.status === "closed" ? null : (
          <Text
            className="flex-1 text-[12px] text-muted-foreground"
            numberOfLines={1}
          >
            {statusLabel(item.careCase)}
          </Text>
        )}
      </View>
      <Text
        className="text-[15px] font-semibold leading-[21px]"
        numberOfLines={2}
      >
        {item.careCase.summaryPlainLanguage}
      </Text>
      <Text className="text-[12px] text-muted-foreground" numberOfLines={1}>
        {journeyLabel(item.journeyStage)}
        {item.unreadMessages > 0 ? ` · ${item.unreadMessages} new message` : ""}
      </Text>
    </View>
    <Icon
      as={ChevronRight}
      className="mt-1 size-[18px] text-muted-foreground"
    />
  </Pressable>
);
