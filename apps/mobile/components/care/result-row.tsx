import type { PatientCase, Severity } from "@hermes/types";
import type { LucideIcon } from "lucide-react-native";
import {
  AlertTriangle,
  CheckCheck,
  CheckCircle2,
  ChevronRight,
  Clock,
} from "lucide-react-native";
import { Pressable, View } from "react-native";
import { Chip } from "@/components/care/chip";
import { SeverityPill } from "@/components/care/severity-pill";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { journeyLabel } from "@/lib/case-format";
import { cn } from "@/lib/utils";

interface Plate {
  icon: LucideIcon;
  surface: string;
  tint: string;
}

const PLATE: Record<Severity, Plate> = {
  Urgent: {
    icon: AlertTriangle,
    surface: "bg-urgent-fill",
    tint: "text-urgent",
  },
  Actionable: {
    icon: Clock,
    surface: "bg-warning-fill",
    tint: "text-warning",
  },
  Routine: {
    icon: CheckCircle2,
    surface: "bg-success-fill",
    tint: "text-success",
  },
};

const CLOSED: Plate = {
  icon: CheckCheck,
  surface: "bg-secondary",
  tint: "text-muted-foreground",
};

interface ResultRowProps {
  item: PatientCase;
  first: boolean;
  onPress: () => void;
}

export const ResultRow = ({ item, first, onPress }: ResultRowProps) => {
  const closed = item.careCase.status === "closed";
  const plate = closed ? CLOSED : PLATE[item.careCase.severity];

  return (
    <Pressable
      accessibilityRole="button"
      android_ripple={{ color: "rgba(148,163,184,0.14)" }}
      onPress={onPress}
      className={cn(
        "flex-row items-center gap-3 bg-card px-4 py-3.5 active:bg-secondary/60",
        first ? null : "border-t border-border/70",
      )}
    >
      <View
        className={cn(
          "size-11 items-center justify-center rounded-[13px]",
          plate.surface,
        )}
      >
        <Icon as={plate.icon} className={cn("size-[20px]", plate.tint)} />
      </View>

      <View className="flex-1 gap-1">
        <View className="flex-row items-center gap-2">
          {closed ? (
            <Chip
              label="Reviewed"
              tone="quiet"
              icon={<CheckCircle2 size={12} color="currentColor" />}
            />
          ) : (
            <SeverityPill severity={item.careCase.severity} />
          )}
          {item.unreadMessages > 0 ? (
            <View className="rounded-full bg-primary px-1.5 py-0.5">
              <Text className="text-[11px] font-bold text-primary-foreground">
                {item.unreadMessages} new
              </Text>
            </View>
          ) : null}
        </View>
        <Text
          className="text-[15px] font-semibold leading-[21px]"
          numberOfLines={2}
        >
          {item.careCase.summaryPlainLanguage}
        </Text>
        <Text className="text-[12px] text-muted-foreground" numberOfLines={1}>
          {journeyLabel(item.journeyStage)}
        </Text>
      </View>

      <Icon as={ChevronRight} className="size-[18px] text-muted-foreground" />
    </Pressable>
  );
};
