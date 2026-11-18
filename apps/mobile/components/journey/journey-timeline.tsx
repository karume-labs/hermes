import {
  CalendarCheck,
  ClipboardList,
  Flag,
  type LucideIcon,
  Stethoscope,
} from "lucide-react-native";
import type * as React from "react";
import { View } from "react-native";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import type { JourneyStep } from "@/lib/care-store";
import { journeyLabel } from "@/lib/case-format";
import type { StepRow } from "@/lib/journey-steps";

/** One mark per stage, so the timeline reads as four known stops. */
export const STEP_ICON: Record<JourneyStep, LucideIcon> = {
  result_received: ClipboardList,
  appointment_booked: CalendarCheck,
  specialist_consultation: Stethoscope,
  completed: Flag,
};

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
                  ? "size-9 items-center justify-center rounded-full bg-primary"
                  : "size-9 items-center justify-center rounded-full bg-secondary"
              }
            >
              <Icon
                as={STEP_ICON[row.step]}
                className={
                  done
                    ? "size-[17px] text-primary-foreground"
                    : "size-[17px] text-muted-foreground"
                }
              />
            </View>
            {index < rows.length - 1 ? (
              <View className="w-px flex-1 bg-border" />
            ) : null}
          </View>
          <View className="flex-1 gap-1 pb-5">
            <Text
              className={
                done
                  ? "text-[15px] font-bold"
                  : "text-[15px] font-medium text-muted-foreground"
              }
            >
              {journeyLabel(row.step)}
            </Text>
            <Text className="text-[13px] leading-[19px] text-muted-foreground">
              {row.detail}
            </Text>
            {row.when === null ? null : (
              <Text className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                {row.when}
              </Text>
            )}
          </View>
        </View>
      );
    })}
  </>
);
