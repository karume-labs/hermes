import type { PatientBooking } from "@hermes/types";
import { useFocusEffect, useRouter } from "expo-router";
import {
  CalendarCheck,
  CalendarClock,
  Clock,
  Stethoscope,
  XCircle,
} from "lucide-react-native";
import * as React from "react";
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  View,
} from "react-native";
import { NextVisitCard } from "@/components/care/next-visit-card";
import { TabScreen } from "@/components/layout/tab-screen";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { IconTile, ListRow, ListSection } from "@/components/ui/list";
import { ScreenHeader } from "@/components/ui/screen-header";
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
  const [refreshing, setRefreshing] = React.useState(false);
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
  const next = upcoming[0];
  const later = upcoming.slice(1);

  const openCarePlan = (caseId: string): void => {
    router.push({ pathname: "/care-action", params: { caseId } });
  };

  return (
    <TabScreen>
      <ScrollView
        className="flex-1 bg-background"
        contentContainerClassName="gap-5 pb-12"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              void load().finally(() => setRefreshing(false));
            }}
          />
        }
      >
        <ScreenHeader
          eyebrow="Appointments"
          title="Your visits"
          subtitle="Confirmed appointments, preparation notes and past visits in one place."
        />

        {loading ? (
          <View className="items-center gap-2 py-16">
            <ActivityIndicator />
            <Text className="text-[13px] text-muted-foreground">
              Loading your visits…
            </Text>
          </View>
        ) : null}

        {error === "" ? null : (
          <Text className="px-5 text-[13px] text-destructive">{error}</Text>
        )}

        {loading || error !== "" ? null : next === undefined ? (
          <View className="mx-4 items-center gap-2 rounded-[18px] border border-dashed border-border px-6 py-10">
            <IconTile tone="muted">
              <Icon
                as={CalendarCheck}
                className="size-[18px] text-muted-foreground"
              />
            </IconTile>
            <Text className="text-[16px] font-semibold">No upcoming visit</Text>
            <Text className="text-center text-[13px] leading-[19px] text-muted-foreground">
              Open a result and book a confirmatory visit when your care team
              asks for one.
            </Text>
            <Button
              variant="outline"
              className="mt-1"
              onPress={() => router.push("/")}
            >
              <Text>View your results</Text>
            </Button>
          </View>
        ) : (
          <View className="gap-5">
            <NextVisitCard item={next} />

            <ListSection
              title="Before you go"
              footer="A reminder arrives 24 hours before your visit."
            >
              <View className="bg-card px-4 py-3.5">
                <Text className="text-[14px] leading-[21px]">
                  {next.booking.prepInstructions}
                </Text>
              </View>
            </ListSection>

            <ListSection title="Visit actions">
              <ListRow
                first
                title="Open care plan"
                subtitle="What this visit covers"
                leading={
                  <IconTile tone="info">
                    <Icon
                      as={Stethoscope}
                      className="size-[18px] text-accent-foreground"
                    />
                  </IconTile>
                }
                chevron
                onPress={() => openCarePlan(next.booking.caseId)}
              />
              <ListRow
                title="Reschedule"
                subtitle="Choose another open slot"
                leading={
                  <IconTile tone="muted">
                    <Icon
                      as={CalendarClock}
                      className="size-[18px] text-muted-foreground"
                    />
                  </IconTile>
                }
                chevron
                onPress={() =>
                  router.push({
                    pathname: "/booking",
                    params: {
                      caseId: next.booking.caseId,
                      bookingId: next.booking.id,
                      clinicId: next.slot.clinicId,
                      kind: next.slot.kind,
                    },
                  })
                }
              />
              <ListRow
                title={
                  cancelling === next.booking.id
                    ? "Cancelling…"
                    : "Cancel visit"
                }
                subtitle="Frees the slot for another patient"
                tone="danger"
                disabled={cancelling !== null}
                leading={
                  <IconTile tone="urgent">
                    <Icon as={XCircle} className="size-[18px] text-urgent" />
                  </IconTile>
                }
                onPress={() => confirmCancel(next)}
              />
            </ListSection>

            {later.length === 0 ? null : (
              <ListSection title="Also booked">
                {later.map((item, index) => (
                  <ListRow
                    key={item.booking.id}
                    first={index === 0}
                    title={formatDateTime(item.slot.startAt)}
                    subtitle={`${item.clinicName} · ${
                      item.slot.kind === "telehealth" ? "Video" : "In person"
                    }`}
                    chevron
                    onPress={() => openCarePlan(item.booking.caseId)}
                  />
                ))}
              </ListSection>
            )}
          </View>
        )}

        {past.length === 0 ? null : (
          <ListSection title="Visit history">
            {past.map((item, index) => (
              <ListRow
                key={item.booking.id}
                first={index === 0}
                leading={
                  <IconTile tone="muted">
                    <Icon
                      as={Clock}
                      className="size-[18px] text-muted-foreground"
                    />
                  </IconTile>
                }
                title={formatDateTime(item.slot.startAt)}
                subtitle={`${statusLabel(item)} · ${item.clinicName}`}
                chevron
                onPress={() => openCarePlan(item.booking.caseId)}
              />
            ))}
          </ListSection>
        )}
      </ScrollView>
    </TabScreen>
  );
};

export default Visits;
