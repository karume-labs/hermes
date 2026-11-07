import type { Booking, Slot } from "@hermes/types";
import { useLocalSearchParams } from "expo-router";
import * as React from "react";
import { addVisitToCalendar } from "@/lib/calendar";
import { careApi } from "@/lib/care-api";
import { scheduleVisitReminder } from "@/lib/notifications";
import { paramString } from "@/lib/params";
import { getPatientId, trackEvent } from "@/lib/session";

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

  return {
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
  };
};
