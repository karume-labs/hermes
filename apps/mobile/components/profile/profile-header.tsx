import type * as React from "react";
import { View } from "react-native";
import { Text } from "@/components/ui/text";

const initialsFor = (name: string | null): string => {
  if (name === null) return "HC";
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
};

export const ProfileHeader = ({
  name,
  clinicName,
  phone,
}: {
  name: string | null;
  clinicName: string;
  phone: string;
}): React.ReactNode => (
  <View className="items-center gap-3 px-5 pt-6">
    <View className="size-[76px] items-center justify-center rounded-full bg-primary">
      <Text className="text-[26px] font-extrabold text-primary-foreground">
        {initialsFor(name)}
      </Text>
    </View>
    <View className="items-center gap-0.5">
      <Text className="text-[22px] font-bold leading-[28px]">
        {name === null ? "Your profile" : name}
      </Text>
      <Text className="text-[14px] text-muted-foreground">
        {name === null ? "" : `${clinicName} · ${phone}`}
      </Text>
    </View>
  </View>
);
