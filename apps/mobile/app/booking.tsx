import type { Booking, Slot } from "@hermes/types";
import { useLocalSearchParams, useRouter } from "expo-router";
import { CalendarCheck, Check } from "lucide-react-native";
import * as React from "react";
import { ActivityIndicator, Pressable, ScrollView, View } from "react-native";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { addVisitToCalendar } from "@/lib/calendar";
import { careApi } from "@/lib/care-api";
import { formatDateTime, slotLabel } from "@/lib/case-format";
import { scheduleVisitReminder } from "@/lib/notifications";
import { paramString } from "@/lib/params";
import { getPatientId, trackEvent } from "@/lib/session";
import { cn } from "@/lib/utils";

const BookingScreen = () => {
  const params = useLocalSearchParams<{
    caseId?: string;
    clinicId?: string;
    kind?: string;
    bookingId?: string;
  }>();
  const caseId = paramString(params.caseId);
  const bookingId = paramString(params.bookingId);
  const rescheduling = bookingId !== undefined;
  const clinicParam = paramString(params.clinicId);
  const clinicId = clinicParam === undefined ? "clinic-1" : clinicParam;
  const kind =
    paramString(params.kind) === "telehealth" ? "telehealth" : "in_person";
  const router = useRouter();
  const [slots, setSlots] = React.useState<Slot[]>([]);
  const [selected, setSelected] = React.useState<Slot | null>(null);
  const [confirmed, setConfirmed] = React.useState<{
    booking: Booking;
    slot: Slot;
  } | null>(null);
  const [calendarNote, setCalendarNote] = React.useState("Syncing calendar…");
  const [busy, setBusy] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    void (async () => {
      try {
        const available = await careApi.slots(clinicId);
        setSlots(
          available.filter(
            (slot) => slot.kind === kind && slot.heldByCaseId === null,
          ),
        );
      } catch (caught) {
        setError(
          caught instanceof Error ? caught.message : "Could not load slots.",
        );
      } finally {
        setLoading(false);
      }
    })();
  }, [clinicId, kind]);

  const confirm = async (): Promise<void> => {
    if (caseId === undefined || selected === null) return;
    setBusy(true);
    setError("");
    try {
      const booking =
        bookingId === undefined
          ? await careApi.book(caseId, selected.id, selected.kind)
          : await careApi.reschedule(bookingId, selected.id, selected.kind);
      setConfirmed({ booking, slot: selected });
      const patientId = await getPatientId();
      trackEvent(patientId, "booking_confirmed", caseId);
      const result = await addVisitToCalendar({
        title: "Confirmatory visit — Hermes Care",
        startAt: selected.startAt,
        endAt: selected.endAt,
        notes: booking.prepInstructions,
        location: clinicId,
      });
      setCalendarNote(
        result.status === "saved"
          ? "Saved to your device calendar with a 24h reminder."
          : "Calendar access is off — your visit is still booked.",
      );
      const reminderAt = new Date(
        new Date(selected.startAt).getTime() - 24 * 60 * 60 * 1000,
      );
      await scheduleVisitReminder(reminderAt).catch(() => "");
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Could not confirm booking.",
      );
    } finally {
      setBusy(false);
    }
  };

  if (confirmed !== null) {
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
            {formatDateTime(confirmed.slot.startAt)}
          </Text>
        </View>
        <View className="gap-2 rounded-xl border border-border p-4">
          <Text className="font-semibold">Before your visit</Text>
          <Text className="text-sm text-muted-foreground">
            {confirmed.booking.prepInstructions}
          </Text>
          <Text className="text-xs text-muted-foreground">{calendarNote}</Text>
        </View>
        <Button
          size="lg"
          onPress={() =>
            router.push({
              pathname: "/journey",
              params: { caseId: confirmed.booking.caseId },
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
  }

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerClassName="gap-3 p-4 pb-12"
    >
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
            Message your care team and they will call you with the next opening.
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
        >
          <View className="gap-1">
            <Text className="font-medium">{slotLabel(slot)}</Text>
            <Text className="text-xs text-muted-foreground">
              {slot.clinicId}
            </Text>
          </View>
          {selected?.id === slot.id ? (
            <Icon as={Check} className="size-5 text-primary" />
          ) : null}
        </Pressable>
      ))}

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
    </ScrollView>
  );
};

export default BookingScreen;
