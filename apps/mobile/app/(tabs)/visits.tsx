import type { PatientBooking } from "@hermes/types";
import { useFocusEffect, useRouter } from "expo-router";
import { CalendarCheck, Clock, Video } from "lucide-react-native";
import * as React from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  View,
} from "react-native";
import { TabScreen } from "@/components/layout/tab-screen";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { careApi } from "@/lib/care-api";
import { formatDateTime } from "@/lib/case-format";
import { getPatientId } from "@/lib/session";

const statusLabel = (booking: PatientBooking): string => {
  if (booking.booking.status === "confirmed") return "Confirmed";
  if (booking.booking.status === "attended") return "Attended";
  if (booking.booking.status === "no_show") return "Missed";
  if (booking.booking.status === "cancelled") return "Cancelled";
  return "Held";
};

const Visits = () => {
  const router = useRouter();
  const [bookings, setBookings] = React.useState<PatientBooking[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [cancelling, setCancelling] = React.useState<string | null>(null);

  const load = React.useCallback(async (): Promise<void> => {
    try {
      setError("");
      const patientId = await getPatientId();
      setBookings(await careApi.patientBookings(patientId));
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Could not load visits.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      void load();
    }, [load]),
  );

  const cancelVisit = async (item: PatientBooking): Promise<void> => {
    setCancelling(item.booking.id);
    try {
      setError("");
      await careApi.cancelBooking(
        item.booking.id,
        "Patient cancelled from the app",
      );
      await load();
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Could not cancel this visit.",
      );
    } finally {
      setCancelling(null);
    }
  };

  const confirmCancel = (item: PatientBooking): void => {
    Alert.alert(
      "Cancel this visit?",
      "This frees the slot for another patient. Your care team will still see your result.",
      [
        { text: "Keep visit", style: "cancel" },
        {
          text: "Cancel visit",
          style: "destructive",
          onPress: () => {
            void cancelVisit(item);
          },
        },
      ],
    );
  };

  const now = Date.now();
  const upcoming = bookings
    .filter(
      (item) =>
        item.booking.status === "confirmed" &&
        new Date(item.slot.startAt).getTime() >= now,
    )
    .sort(
      (left, right) =>
        new Date(left.slot.startAt).getTime() -
        new Date(right.slot.startAt).getTime(),
    );
  const past = bookings.filter(
    (item) =>
      item.booking.status !== "confirmed" ||
      new Date(item.slot.startAt).getTime() < now,
  );

  return (
    <TabScreen>
      <ScrollView
        className="flex-1 bg-background"
        contentContainerClassName="gap-4 p-4 pb-12"
      >
        <View className="gap-1">
          <Text className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
            Appointments
          </Text>
          <Text variant="h3">Your visits</Text>
          <Text className="text-sm text-muted-foreground">
            Confirmed appointments, preparation notes and past visits in one
            place.
          </Text>
        </View>

        {loading ? (
          <View className="items-center gap-2 py-10">
            <ActivityIndicator />
            <Text className="text-muted-foreground">Loading your visits…</Text>
          </View>
        ) : null}

        {error === "" ? null : (
          <Text className="text-sm text-destructive">{error}</Text>
        )}

        {loading || error !== "" ? null : upcoming.length === 0 ? (
          <View className="items-center gap-2 rounded-xl border border-border p-6">
            <Icon as={CalendarCheck} className="size-8 text-muted-foreground" />
            <Text className="font-medium">No upcoming visit</Text>
            <Text className="text-center text-sm text-muted-foreground">
              Open a result and book a confirmatory visit when your care team
              asks for one.
            </Text>
            <Button variant="outline" onPress={() => router.push("/")}>
              <Text>View your results</Text>
            </Button>
          </View>
        ) : (
          upcoming.map((item) => (
            <View
              key={item.booking.id}
              className="gap-3 rounded-xl border border-primary/30 bg-secondary p-4"
            >
              <View className="flex-row items-center justify-between gap-2">
                <View className="flex-row items-center gap-2">
                  <Icon
                    as={item.slot.kind === "telehealth" ? Video : CalendarCheck}
                    className="size-5 text-primary"
                  />
                  <Text className="font-semibold">
                    {item.slot.kind === "telehealth"
                      ? "Video visit"
                      : "In-person visit"}
                  </Text>
                </View>
                <Text className="text-xs font-semibold uppercase tracking-wide text-primary">
                  Confirmed
                </Text>
              </View>
              <Text className="text-lg font-semibold">
                {formatDateTime(item.slot.startAt)}
              </Text>
              <Text className="text-sm text-muted-foreground">
                {item.clinicName}
              </Text>
              <View className="gap-1 rounded-lg border border-border bg-card p-3">
                <Text className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Prepare
                </Text>
                <Text className="text-sm">{item.booking.prepInstructions}</Text>
              </View>
              <Button
                variant="outline"
                onPress={() =>
                  router.push({
                    pathname: "/care-action",
                    params: { caseId: item.booking.caseId },
                  })
                }
              >
                <Text>Open care plan</Text>
              </Button>
              <Button
                variant="secondary"
                onPress={() =>
                  router.push({
                    pathname: "/booking",
                    params: {
                      caseId: item.booking.caseId,
                      bookingId: item.booking.id,
                      clinicId: item.slot.clinicId,
                      kind: item.slot.kind,
                    },
                  })
                }
              >
                <Text>Reschedule visit</Text>
              </Button>
              <Button
                variant="ghost"
                disabled={cancelling !== null}
                onPress={() => confirmCancel(item)}
              >
                <Text className="text-destructive">
                  {cancelling === item.booking.id
                    ? "Cancelling…"
                    : "Cancel visit"}
                </Text>
              </Button>
            </View>
          ))
        )}

        {past.length === 0 ? null : (
          <View className="gap-2">
            <Text className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
              Visit history
            </Text>
            {past.map((item) => (
              <Pressable
                key={item.booking.id}
                className="gap-2 rounded-xl border border-border bg-card p-4 active:bg-accent"
                onPress={() =>
                  router.push({
                    pathname: "/care-action",
                    params: { caseId: item.booking.caseId },
                  })
                }
              >
                <View className="flex-row items-center justify-between gap-2">
                  <Text className="font-medium">
                    {formatDateTime(item.slot.startAt)}
                  </Text>
                  <Text className="text-xs text-muted-foreground">
                    {statusLabel(item)}
                  </Text>
                </View>
                <View className="flex-row items-center gap-2">
                  <Icon as={Clock} className="size-3.5 text-muted-foreground" />
                  <Text className="text-xs text-muted-foreground">
                    {item.clinicName} ·{" "}
                    {item.slot.kind === "telehealth" ? "Video" : "In person"}
                  </Text>
                </View>
                <Text className="text-sm text-muted-foreground">
                  {item.summary}
                </Text>
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>
    </TabScreen>
  );
};

export default Visits;
