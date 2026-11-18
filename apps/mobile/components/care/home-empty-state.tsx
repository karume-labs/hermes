import { HeartPulse, RefreshCw } from "lucide-react-native";
import type * as React from "react";
import { View } from "react-native";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { IconTile } from "@/components/ui/list";
import { Text } from "@/components/ui/text";

export const HomeEmptyState = (): React.ReactNode => (
  <View className="mx-4 items-center gap-2 rounded-[18px] border border-dashed border-border px-6 py-10">
    <IconTile tone="muted">
      <Icon as={HeartPulse} className="size-[18px] text-muted-foreground" />
    </IconTile>
    <Text className="text-[16px] font-semibold">No screening updates yet</Text>
    <Text className="text-center text-[13px] leading-[19px] text-muted-foreground">
      When a partner lab sends a result, it appears here and we send you a
      secure push notification.
    </Text>
  </View>
);

export const HomeErrorCard = ({
  error,
  onRetry,
}: {
  error: string;
  onRetry: () => void;
}): React.ReactNode => (
  <View className="mx-4 gap-3 rounded-[16px] border border-destructive/40 bg-destructive/5 p-4">
    <Text className="text-[15px] font-semibold">
      We could not reach your clinic.
    </Text>
    <Text className="text-[13px] leading-[19px] text-muted-foreground">
      {error}
    </Text>
    <Button variant="outline" onPress={onRetry}>
      <Icon as={RefreshCw} className="size-4" />
      <Text>Try again</Text>
    </Button>
  </View>
);

export const SignedInBanner = ({
  patientLabel,
}: {
  patientLabel: string;
}): React.ReactNode => (
  <View className="mx-4 flex-row items-center gap-3 rounded-[18px] border border-border/70 bg-card p-4">
    <View className="size-10 items-center justify-center rounded-full bg-primary/15">
      <Text className="text-[15px] font-extrabold text-primary">
        {(patientLabel === "" ? "H" : patientLabel).slice(0, 1).toUpperCase()}
      </Text>
    </View>
    <View className="flex-1 gap-0.5">
      <Text className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
        Signed in
      </Text>
      <Text className="text-[15px] font-semibold" numberOfLines={1}>
        {patientLabel === "" ? "Your account" : patientLabel}
      </Text>
    </View>
    <View className="flex-row items-center gap-1.5 rounded-full border border-success/30 bg-success-fill px-2.5 py-1">
      <View className="size-1.5 rounded-full bg-success" />
      <Text className="text-[11px] font-bold text-success">Secure</Text>
    </View>
  </View>
);
