import { Check, Clock } from "lucide-react-native";
import type * as React from "react";
import { View } from "react-native";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { journeyLabel } from "@/lib/case-format";
import type { StepRow } from "@/lib/journey-steps";

export const JourneyTimeline = ({
  rows,
  current,
}: {
  rows: StepRow[];
  current: number;
}): React.ReactNode => (
  <>
    {rows.map((row, index) => {
      const done = index <= current;
      return (
        <View key={row.step} className="flex-row gap-3">
          <View className="items-center">
            <View
              className={
                done
                  ? "size-8 items-center justify-center rounded-full bg-primary"
                  : "size-8 items-center justify-center rounded-full border border-border"
              }
            >
              <Icon
                as={done ? Check : Clock}
                className={
                  done
                    ? "size-4 text-primary-foreground"
                    : "size-4 text-muted-foreground"
                }
              />
            </View>
            {index < rows.length - 1 ? (
              <View className="w-px flex-1 bg-border" />
            ) : null}
          </View>
          <View className="flex-1 gap-1 pb-4">
            <Text className={done ? "font-semibold" : "text-muted-foreground"}>
              {journeyLabel(row.step)}
            </Text>
            <Text className="text-sm text-muted-foreground">{row.detail}</Text>
            {row.when === null ? null : (
              <Text className="text-xs text-muted-foreground">{row.when}</Text>
            )}
          </View>
        </View>
      );
    })}
  </>
);
