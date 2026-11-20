import { useFocusEffect, useLocalSearchParams } from "expo-router";
import * as React from "react";
import {
  useAcknowledgeCase,
  useMarkCaseRead,
  useMarkNotificationRead,
  usePatientCase,
  useRecordEvent,
  useSubmitFeedback,
} from "@/lib/api/queries";
import { syncVisitToCalendar } from "@/lib/calendar";
import { paramString } from "@/lib/params";

export const useCareAction = () => {
  const params = useLocalSearchParams<{
    caseId?: string;
    patientId?: string;
  }>();
  const caseId = paramString(params.caseId);
  const detail = usePatientCase(caseId);
  const acknowledgeCase = useAcknowledgeCase();
  const feedback = useSubmitFeedback();
  const markRead = useMarkCaseRead(caseId);
  const markNotificationRead = useMarkNotificationRead();
  const recordEvent = useRecordEvent();
  const [error, setError] = React.useState("");
  const [calendarNote, setCalendarNote] = React.useState("");

  const patientCase = detail.data ?? null;

  useFocusEffect(
    React.useCallback(() => {
      void detail.refetch();
    }, [detail.refetch]),
  );

  // Opening a result is a read receipt for the case and its unread alerts.
  React.useEffect(() => {
    if (caseId === undefined) return;
    recordEvent.mutate({ type: "case_viewed", caseId });
    markRead.mutate();
    for (const item of detail.data?.notifications ?? []) {
      const notification = item as {
        id: string;
        kind: string;
        status: string;
      };
      if (
        notification.kind === "case_alert" &&
        (notification.status === "sent" || notification.status === "delivered")
      ) {
        markNotificationRead.mutate(notification.id);
      }
    }
  }, [
    caseId,
    detail.data?.notifications,
    markNotificationRead.mutate,
    markRead.mutate,
    recordEvent.mutate,
  ]);

  const acknowledge = async (): Promise<void> => {
    if (caseId === undefined) return;
    setError("");
    try {
      await acknowledgeCase.mutateAsync(caseId);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not confirm.");
    }
  };

  const syncCalendar = async (): Promise<void> => {
    if (patientCase === null || patientCase.slot === null) return;
    const result = await syncVisitToCalendar({
      caseId: patientCase.careCase.id,
      title: "Confirmatory visit — Hermes Care",
      startAt: patientCase.slot.startAt,
      endAt: patientCase.slot.endAt,
      notes:
        patientCase.appointment?.prepInstructions === undefined
          ? "Bring prior labs."
          : patientCase.appointment.prepInstructions,
      location: patientCase.slot.clinicId,
    });
    setCalendarNote(
      result.status === "saved"
        ? "Saved to your calendar with a 24h reminder."
        : result.status === "denied"
          ? "Calendar access was declined. You can still see your visit here."
          : "No writable calendar found on this device.",
    );
  };

  const submitFeedback = async (
    understood: boolean,
    confidence: number,
  ): Promise<void> => {
    if (caseId === undefined) return;
    setError("");
    try {
      await feedback.mutateAsync({ caseId, understood, confidence });
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Could not save your answer.",
      );
    }
  };

  return {
    detail: patientCase,
    error:
      error !== "" ? error : detail.error !== null ? detail.error.message : "",
    busy: acknowledgeCase.isPending,
    calendarNote,
    feedbackBusy: feedback.isPending,
    acknowledge,
    syncCalendar,
    submitFeedback,
  };
};
