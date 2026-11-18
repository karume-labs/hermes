import type { ReactNode } from "react";
import { View } from "react-native";
import { Text } from "@/components/ui/text";

interface ScreenHeaderProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  trailing?: ReactNode;
  /** Section mark shown in a spark-tinted plate beside the title. */
  icon?: ReactNode;
}

/** Large title that scrolls with the content, the way native apps open a tab. */
export const ScreenHeader = ({
  eyebrow,
  title,
  subtitle,
  trailing,
  icon,
}: ScreenHeaderProps) => (
  <View className="gap-1.5 px-5 pb-2 pt-4">
    {eyebrow === undefined ? null : (
      <View className="flex-row items-center gap-2">
        <View className="h-[3px] w-[18px] rounded-full bg-primary" />
        <Text className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          {eyebrow}
        </Text>
      </View>
    )}
    <View className="flex-row items-center justify-between gap-3">
      <View className="flex-1 flex-row items-center gap-3">
        {icon === undefined ? null : (
          <View className="size-11 items-center justify-center rounded-[13px] bg-primary/15">
            {icon}
          </View>
        )}
        <Text className="flex-1 text-[28px] font-extrabold leading-[34px] tracking-[-0.02em]">
          {title}
        </Text>
      </View>
      {trailing}
    </View>
    {subtitle === undefined ? null : (
      <Text className="text-[15px] leading-[22px] text-muted-foreground">
        {subtitle}
      </Text>
    )}
  </View>
);
