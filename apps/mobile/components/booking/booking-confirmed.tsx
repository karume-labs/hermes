import type { Booking, Slot } from "@hermes/types";
import { useRouter } from "expo-router";
import { CalendarCheck } from "lucide-react-native";
import type * as React from "react";
import { ScrollView, View } from "react-native";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { formatDateTime } from "@/lib/case-format";

export const BookingConfirmed = ({
  booking,
  slot,
  calendarNote,
  rescheduling,
}: {
  booking: Booking;
  slot: Slot;
  calendarNote: string;
  rescheduling: boolean;
}): React.ReactNode => {
  const router = useRouter();

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerClassName="gap-4 p-4"
    >
      <View className="items-center gap-2 py-6">
        <View className="size-16 items-center justify-center rounded-full bg-emerald-100">
          <Icon as={CalendarCheck} className="size-8 text-emerald-700" />
        </View>
        <Text variant="h3">
          {rescheduling ? "Visit rescheduled" : "Visit confirmed"}
        </Text>
        <Text className="text-muted-foreground">
          {formatDateTime(slot.startAt)}
        </Text>
      </View>
      <View className="gap-2 rounded-xl border border-border p-4">
        <Text className="font-semibold">Before your visit</Text>
        <Text className="text-sm text-muted-foreground">
          {booking.prepInstructions}
        </Text>
        <Text className="text-xs text-muted-foreground">{calendarNote}</Text>
      </View>
      <Button
        size="lg"
        onPress={() =>
          router.push({
            pathname: "/journey",
            params: { caseId: booking.caseId },
          })
        }
      >
        <Text>Track your care journey</Text>
      </Button>
      <Button variant="ghost" onPress={() => router.back()}>
        <Text>Back to result</Text>
      </Button>
    </ScrollView>
  );
};
