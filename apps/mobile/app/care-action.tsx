import { ActivityIndicator, ScrollView, View } from "react-native";
import { BiometricGate } from "@/components/care/biometric-gate";
import { AckCard } from "@/components/care/case-ack-card";
import { ClosureCard, FeedbackCard } from "@/components/care/case-actions";
import { NextSteps } from "@/components/care/case-next-steps";
import { VisitCard } from "@/components/care/case-visit-card";
import { ResultSummary } from "@/components/care/result-summary";
import { Text } from "@/components/ui/text";
import { useCareAction } from "@/lib/use-care-action";

const CareAction = () => {
  const {
    detail,
    error,
    busy,
    calendarNote,
    feedbackBusy,
    acknowledge,
    syncCalendar,
    submitFeedback,
  } = useCareAction();

  if (error !== "") {
    return (
      <BiometricGate>
        <ScrollView
          className="flex-1 bg-background"
          contentContainerClassName="gap-6 pb-12 pt-3"
        >
          <Text className="text-destructive">{error}</Text>
        </ScrollView>
      </BiometricGate>
    );
  }

  if (detail === null) {
    return (
      <BiometricGate>
        <ScrollView
          className="flex-1 bg-background"
          contentContainerClassName="gap-6 pb-12 pt-3"
        >
          <View className="items-center gap-2 py-10">
            <ActivityIndicator />
            <Text className="text-muted-foreground">
              Unlocking your result…
            </Text>
          </View>
        </ScrollView>
      </BiometricGate>
    );
  }

  return (
    <BiometricGate>
      <ScrollView
        className="flex-1 bg-background"
        contentContainerClassName="gap-6 pb-12 pt-3"
      >
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
      </ScrollView>
    </BiometricGate>
  );
};

export default CareAction;
