import type { PatientBooking } from "@hermes/types";
import { useFocusEffect } from "expo-router";
import * as React from "react";
import { Alert } from "react-native";
import { useCancelBooking, usePatientBookings } from "@/lib/api/queries";

export const useVisits = () => {
  const bookings = usePatientBookings();
  const cancel = useCancelBooking();

  useFocusEffect(
    React.useCallback(() => {
      void bookings.refetch();
    }, [bookings.refetch]),
  );

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
            cancel.mutate({
              bookingId: item.booking.id,
              reason: "Patient cancelled from the app",
            });
          },
        },
      ],
    );
  };

  const items = bookings.data ?? [];
  const now = Date.now();
  const upcoming = items
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
  const past = items.filter(
    (item) =>
      item.booking.status !== "confirmed" ||
      new Date(item.slot.startAt).getTime() < now,
  );

  return {
    loading: bookings.isPending,
    refreshing: bookings.isRefetching,
    error:
      bookings.error !== null
        ? bookings.error.message
        : cancel.error !== null
          ? cancel.error.message
          : "",
    cancelling: cancel.isPending ? (cancel.variables?.bookingId ?? null) : null,
    refresh: () => {
      void bookings.refetch();
    },
    confirmCancel,
    next: upcoming[0],
    later: upcoming.slice(1),
    past,
  };
};
