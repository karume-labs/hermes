import type * as React from "react";
import { View } from "react-native";
import { HermesMark } from "@/components/brand/hermes-mark";
import { Text } from "@/components/ui/text";

interface BrandHeaderProps {
  title: string;
}

export const BrandHeader = ({
  title,
}: BrandHeaderProps): React.ReactElement => (
  <View className="flex-row items-center gap-2">
    <HermesMark size={26} />
    <View>
      <Text className="text-[15px] font-semibold leading-tight text-foreground">
        {title}
      </Text>
      <Text className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
        Hermes care
      </Text>
    </View>
  </View>
);
