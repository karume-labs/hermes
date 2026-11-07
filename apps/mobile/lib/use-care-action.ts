import { useFocusEffect, useLocalSearchParams } from "expo-router";
import * as React from "react";
import { addVisitToCalendar } from "@/lib/calendar";
import { careApi, type PatientCaseDetail } from "@/lib/care-api";
import { paramString } from "@/lib/params";
import { getPatientId, trackEvent } from "@/lib/session";

export const useCareAction = () => {
  const params = useLocalSearchParams<{
    caseId?: string;
    patientId?: string;
  }>();
  const caseId = paramString(params.caseId);
  const [patientId, setPatientId] = React.useState<string | null>(null);
  const [detail, setDetail] = React.useState<PatientCaseDetail | null>(null);
  const [error, setError] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [calendarNote, setCalendarNote] = React.useState("");
  const [feedbackBusy, setFeedbackBusy] = React.useState(false);

  const load = React.useCallback(
    async (pid: string, cid: string): Promise<void> => {
      try {
        setError("");
        const found = await careApi.patientCase(pid, cid);
        setDetail(found);
        trackEvent(pid, "case_viewed", cid);
        await careApi.markRead(pid, cid);
        const unread = found.notifications.filter(
          (item) =>
            item.kind === "case_alert" &&
            (item.status === "sent" || item.status === "delivered"),
        );
        await Promise.all(
          unread.map((item) => careApi.markNotificationRead(pid, item.id)),
        );
      } catch (caught) {
        setError(
          caught instanceof Error
            ? caught.message
            : "Could not load this result.",
        );
      }
    },
    [],
  );

  React.useEffect(() => {
    void (async () => {
      const paramPatientId = paramString(params.patientId);
      const pid =
        paramPatientId === undefined ? await getPatientId() : paramPatientId;
      setPatientId(pid);
      if (caseId === undefined) setError("No result selected.");
    })();
  }, [caseId, params.patientId]);

  // Returning from booking must replace the superseded visit with the new one.
  useFocusEffect(
    React.useCallback(() => {
      if (patientId !== null && caseId !== undefined) {
        void load(patientId, caseId);
      }
    }, [caseId, load, patientId]),
  );

  const acknowledge = async (): Promise<void> => {
    if (patientId === null || caseId === undefined || detail === null) return;
    setBusy(true);
    try {
      await careApi.acknowledge(caseId, patientId);
      await load(patientId, caseId);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not confirm.");
    } finally {
      setBusy(false);
    }
  };

  const syncCalendar = async (): Promise<void> => {
    if (detail === null || detail.slot === null) return;
    const result = await addVisitToCalendar({
      title: "Confirmatory visit — Hermes Care",
      startAt: detail.slot.startAt,
      endAt: detail.slot.endAt,
      notes:
        detail.appointment?.prepInstructions === undefined
          ? "Bring prior labs."
          : detail.appointment.prepInstructions,
      location: detail.slot.clinicId,
    });
    if (result.status === "saved") {
      setCalendarNote("Saved to your calendar with a 24h reminder.");
      return;
    }
    setCalendarNote(
      result.status === "denied"
        ? "Calendar access was declined. You can still see your visit here."
        : "No writable calendar found on this device.",
    );
  };

  const submitFeedback = async (
    understood: boolean,
    confidence: number,
  ): Promise<void> => {
    if (patientId === null || caseId === undefined) return;
    setFeedbackBusy(true);
    try {
      await careApi.feedback(patientId, caseId, understood, confidence);
      await load(patientId, caseId);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Could not save your answer.",
      );
    } finally {
      setFeedbackBusy(false);
    }
  };

  return {
    detail,
    error,
    busy,
    calendarNote,
    feedbackBusy,
    acknowledge,
    syncCalendar,
    submitFeedback,
  };
};
