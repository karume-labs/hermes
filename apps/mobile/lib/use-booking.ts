import type { Booking, Slot } from "@hermes/types";
import { useLocalSearchParams } from "expo-router";
import * as React from "react";
import {
  useBookVisit,
  useRecordEvent,
  useRescheduleBooking,
  useSlots,
} from "@/lib/api/queries";
import { addVisitToCalendar } from "@/lib/calendar";
import { scheduleVisitReminder } from "@/lib/notifications";
import { paramString } from "@/lib/params";

export const useBooking = () => {
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

  const slots = useSlots(clinicId, kind);
  const book = useBookVisit();
  const reschedule = useRescheduleBooking();
  const recordEvent = useRecordEvent();
  const [selected, setSelected] = React.useState<Slot | null>(null);
  const [confirmed, setConfirmed] = React.useState<{
    booking: Booking;
    slot: Slot;
  } | null>(null);
  const [calendarNote, setCalendarNote] = React.useState("Syncing calendar…");
  const [error, setError] = React.useState("");

  const confirm = async (): Promise<void> => {
    if (caseId === undefined || selected === null) return;
    setError("");
    try {
      const booking =
        bookingId === undefined
          ? await book.mutateAsync({
              caseId,
              slotId: selected.id,
              kind: selected.kind,
            })
          : await reschedule.mutateAsync({
              bookingId,
              slotId: selected.id,
              kind: selected.kind,
            });
      setConfirmed({ booking, slot: selected });
      recordEvent.mutate({ type: "booking_confirmed", caseId });
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
    }
  };

  return {
    kind,
    slots: slots.data ?? [],
    selected,
    setSelected,
    confirmed,
    calendarNote,
    busy: book.isPending || reschedule.isPending,
    loading: slots.isPending,
    error:
      error !== "" ? error : slots.error !== null ? slots.error.message : "",
    rescheduling,
    confirm,
  };
};
