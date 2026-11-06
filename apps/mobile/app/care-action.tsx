import { useFocusEffect, useLocalSearchParams } from "expo-router";
import * as React from "react";
import { ActivityIndicator, ScrollView, View } from "react-native";
import { BiometricGate } from "@/components/care/biometric-gate";
import {
  AckCard,
  ClosureCard,
  FeedbackCard,
  NextSteps,
  VisitCard,
} from "@/components/care/case-actions";
import { ResultSummary } from "@/components/care/result-summary";
import { Text } from "@/components/ui/text";
import { addVisitToCalendar } from "@/lib/calendar";
import { careApi, type PatientCaseDetail } from "@/lib/care-api";
import { paramString } from "@/lib/params";
import { getPatientId, trackEvent } from "@/lib/session";

const CareAction = () => {
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
      const pid = paramString(params.patientId) ?? (await getPatientId());
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
      notes: detail.appointment?.prepInstructions ?? "Bring prior labs.",
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

  const renderBody = (): React.ReactNode => {
    if (error !== "") {
      return <Text className="text-destructive">{error}</Text>;
    }
    if (detail === null) {
      return (
        <View className="items-center gap-2 py-10">
          <ActivityIndicator />
          <Text className="text-muted-foreground">Unlocking your result…</Text>
        </View>
      );
    }
    return (
      <>
        <ResultSummary careCase={detail.careCase} />
        {detail.careCase.status === "closed" ? (
          <ClosureCard careCase={detail.careCase} />
        ) : null}
        {detail.appointment !== null && detail.slot !== null ? (
          <VisitCard
            appointment={detail.appointment}
            slot={detail.slot}
            calendarNote={calendarNote}
            onSyncCalendar={syncCalendar}
          />
        ) : null}
        <AckCard
          careCase={detail.careCase}
          busy={busy}
          onAcknowledge={acknowledge}
        />
        <FeedbackCard
          careCase={detail.careCase}
          feedback={detail.feedback}
          busy={feedbackBusy}
          onSubmit={submitFeedback}
        />
        <NextSteps careCase={detail.careCase} />
      </>
    );
  };

  return (
    <BiometricGate>
      <ScrollView
        className="flex-1 bg-background"
        contentContainerClassName="gap-4 p-4 pb-12"
      >
        {renderBody()}
      </ScrollView>
    </BiometricGate>
  );
};

export default CareAction;
