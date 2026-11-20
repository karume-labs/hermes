import { Check } from "lucide-react-native";
import { ActivityIndicator, Pressable, ScrollView, View } from "react-native";
import { BookingConfirmed } from "@/components/booking/booking-confirmed";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { slotLabel } from "@/lib/case-format";
import { useBooking } from "@/lib/use-booking";
import { cn } from "@/lib/utils";

const BookingScreen = () => {
  const {
    kind,
    slots,
    selected,
    setSelected,
    confirmed,
    calendarNote,
    busy,
    loading,
    error,
    rescheduling,
    confirm,
  } = useBooking();

  if (confirmed !== null) {
    return (
      <BookingConfirmed
        booking={confirmed.booking}
        slot={confirmed.slot}
        calendarNote={calendarNote}
        rescheduling={rescheduling}
      />
    );
  }

  return (
    <View className="flex-1 bg-background">
      <ScrollView className="flex-1" contentContainerClassName="gap-3 p-4 pb-8">
        <Text variant="h3">
          {rescheduling
            ? "Choose a new time"
            : kind === "telehealth"
              ? "Video review"
              : "In-person visit"}
        </Text>
        <Text className="text-muted-foreground">
          Choose a slot that works for you. Prep instructions and a 24h reminder
          follow automatically.
        </Text>

        {loading ? (
          <View className="items-center gap-2 py-8">
            <ActivityIndicator />
            <Text className="text-muted-foreground">Loading open slots…</Text>
          </View>
        ) : null}

        {error === "" ? null : (
          <Text className="text-sm text-destructive">{error}</Text>
        )}

        {!loading && error === "" && slots.length === 0 ? (
          <View className="gap-2 rounded-xl border border-border p-4">
            <Text className="font-medium">No slots open right now</Text>
            <Text className="text-sm text-muted-foreground">
              Message your care team and they will call you with the next
              opening.
            </Text>
          </View>
        ) : null}

        {slots.map((slot) => (
          <Pressable
            key={slot.id}
            className={cn(
              "flex-row items-center justify-between gap-3 rounded-xl border p-4",
              selected?.id === slot.id
                ? "border-primary bg-secondary"
                : "border-border active:bg-accent",
            )}
            onPress={() => setSelected(slot)}
            accessibilityRole="radio"
            accessibilityState={{ selected: selected?.id === slot.id }}
          >
            <Text className="font-medium">{slotLabel(slot)}</Text>
            {selected?.id === slot.id ? (
              <Icon as={Check} className="size-5 text-primary" />
            ) : null}
          </Pressable>
        ))}
      </ScrollView>
      {/* The list runs to thirty slots, so the confirm step stays pinned to
          the bottom edge instead of waiting at the end of the scroll. */}
      <View className="border-t border-border bg-background px-4 py-3">
        <Button
          size="lg"
          disabled={selected === null || busy || loading}
          onPress={confirm}
        >
          <Text>
            {busy
              ? "Confirming…"
              : rescheduling
                ? "Confirm new time"
                : "Confirm booking"}
          </Text>
        </Button>
      </View>
    </View>
  );
};

export default BookingScreen;
