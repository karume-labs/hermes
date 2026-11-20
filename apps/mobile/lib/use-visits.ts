import type { PatientBooking } from "@hermes/types";
import { useFocusEffect } from "expo-router";
import * as React from "react";
import { Alert, Platform } from "react-native";
import { useCancelBooking, usePatientBookings } from "@/lib/api/queries";
import { removeVisitFromCalendar } from "@/lib/calendar";
import { cancelVisitReminder } from "@/lib/notifications";

const CANCEL_TITLE = "Cancel this visit?";
const CANCEL_BODY =
  "This frees the slot for another patient. Your care team will still see your result.";

export const useVisits = () => {
  const bookings = usePatientBookings();
  const cancel = useCancelBooking();

  useFocusEffect(
    React.useCallback(() => {
      void bookings.refetch();
    }, [bookings.refetch]),
  );

  const confirmCancel = (item: PatientBooking): void => {
    const cancelIt = (): void => {
      cancel.mutate(
        {
          bookingId: item.booking.id,
          reason: "Patient cancelled from the app",
        },
        {
          onSuccess: () => {
            void removeVisitFromCalendar(item.booking.caseId);
            void cancelVisitReminder();
          },
        },
      );
    };
    // react-native-web ships no Alert, so the browser build never showed the
    // dialog and a visit could not be cancelled there at all.
    if (Platform.OS === "web") {
      if (globalThis.confirm(`${CANCEL_TITLE} ${CANCEL_BODY}`)) cancelIt();
      return;
    }
    Alert.alert(CANCEL_TITLE, CANCEL_BODY, [
      { text: "Keep visit", style: "cancel" },
      { text: "Cancel visit", style: "destructive", onPress: cancelIt },
    ]);
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
