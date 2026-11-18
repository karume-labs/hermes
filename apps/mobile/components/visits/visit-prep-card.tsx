import { ClipboardList } from "lucide-react-native";
import type * as React from "react";
import { View } from "react-native";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";

/** What the patient needs to know before the visit, as one toned card. */
export const VisitPrepCard = ({
  instructions,
}: {
  instructions: string;
}): React.ReactNode => (
  <View className="mx-4 gap-2.5 rounded-[18px] border border-border/70 bg-card p-4">
    <View className="flex-row items-center gap-2">
      <View className="size-7 items-center justify-center rounded-[9px] bg-accent">
        <Icon
          as={ClipboardList}
          className="size-[15px] text-accent-foreground"
        />
      </View>
      <Text className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
        Before you go
      </Text>
    </View>
    <Text className="text-[14px] leading-[21px]">{instructions}</Text>
  </View>
);
