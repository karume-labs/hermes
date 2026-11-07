import type { PatientBooking } from "@hermes/types";
import { useFocusEffect } from "expo-router";
import * as React from "react";
import { Alert } from "react-native";
import { careApi } from "@/lib/care-api";
import { getPatientId } from "@/lib/session";

export const useVisits = () => {
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

  const refresh = (): void => {
    setRefreshing(true);
    void load().finally(() => setRefreshing(false));
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

  return {
    loading,
    refreshing,
    error,
    cancelling,
    refresh,
    confirmCancel,
    next: upcoming[0],
    later: upcoming.slice(1),
    past,
  };
};
