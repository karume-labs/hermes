import type { ReactNode } from "react";
import { View } from "react-native";
import { Text } from "@/components/ui/text";

interface ScreenHeaderProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  trailing?: ReactNode;
}

/** Large title that scrolls with the content, the way native apps open a tab. */
export const ScreenHeader = ({
  eyebrow,
  title,
  subtitle,
  trailing,
}: ScreenHeaderProps) => (
  <View className="gap-1.5 px-5 pb-2 pt-4">
    {eyebrow === undefined ? null : (
      <Text className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        {eyebrow}
      </Text>
    )}
    <View className="flex-row items-center justify-between gap-3">
      <Text className="flex-1 text-[28px] font-extrabold leading-[34px] tracking-[-0.02em]">
        {title}
      </Text>
      {trailing}
    </View>
    {subtitle === undefined ? null : (
      <Text className="max-w-[46ch] text-[15px] leading-[22px] text-muted-foreground">
        {subtitle}
      </Text>
    )}
  </View>
);
