import { ShieldCheck } from "lucide-react-native";
import type * as React from "react";
import { View } from "react-native";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";

export const SignInHeader = (): React.ReactNode => (
  <View className="items-center gap-3">
    <View className="size-16 items-center justify-center rounded-full bg-primary/10">
      <Icon as={ShieldCheck} className="size-8 text-primary" />
    </View>
    <Text variant="h2" className="text-center text-[28px]">
      Sign in to your results
    </Text>
    <Text className="text-center text-muted-foreground">
      We send a one-time code to the phone number your clinic has on file. No
      password to remember.
    </Text>
  </View>
);

export const SignInError = ({ error }: { error: string }): React.ReactNode =>
  error === "" ? null : (
    <View className="gap-1 rounded-xl border border-destructive/40 bg-destructive/5 p-3">
      <Text className="text-sm text-destructive">{error}</Text>
    </View>
  );
