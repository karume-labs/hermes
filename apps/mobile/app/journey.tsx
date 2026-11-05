import { useLocalSearchParams } from "expo-router";
import { Check, Clock } from "lucide-react-native";
import * as React from "react";
import { ActivityIndicator, ScrollView, View } from "react-native";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { careApi, type PatientCaseDetail } from "@/lib/care-api";
import { type JourneyStep, stepIndex } from "@/lib/care-store";
import {
  formatDate,
  formatDateTime,
  journeyHint,
  journeyLabel,
} from "@/lib/case-format";
import { paramString } from "@/lib/params";
import { getPatientId } from "@/lib/session";

interface StepRow {
  step: JourneyStep;
  detail: string;
  when: string | null;
}

const stepRows = (detail: PatientCaseDetail): StepRow[] => {
  const careCase = detail.careCase;
  const consulted =
    careCase.referralClinicId !== null || careCase.closedAt !== null;
  return [
    {
      step: "result_received",
      detail: careCase.summaryPlainLanguage,
      when: formatDateTime(careCase.createdAt),
    },
    {
      step: "appointment_booked",
      detail:
        detail.slot === null
          ? "No visit booked yet."
          : `${detail.slot.kind === "telehealth" ? "Video visit" : "In person"} · ${formatDateTime(detail.slot.startAt)}`,
      when:
        detail.appointment === null
          ? null
          : formatDateTime(detail.appointment.createdAt),
    },
    {
      step: "specialist_consultation",
      detail: consulted
        ? `Shared record linked to ${careCase.referralClinicId ?? careCase.clinicId}.`
        : "Your clinician reviews the result at your visit.",
      when: consulted ? formatDateTime(careCase.updatedAt) : null,
    },
    {
      step: "completed",
      detail:
        careCase.closurePlan === null
          ? "Awaiting clinical sign-off."
          : careCase.closurePlan,
      when: careCase.closedAt === null ? null : formatDate(careCase.closedAt),
    },
  ];
};

const Journey = () => {
  const params = useLocalSearchParams<{ caseId?: string }>();
  const caseId = paramString(params.caseId);
  const [detail, setDetail] = React.useState<PatientCaseDetail | null>(null);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    void (async () => {
      try {
        const patientId = await getPatientId();
        if (caseId === undefined) {
          const cases = await careApi.patientCases(patientId);
          const first = cases[0];
          if (first === undefined) {
            setError("No care journey yet.");
            return;
          }
          setDetail(await careApi.patientCase(patientId, first.careCase.id));
          return;
        }
        setDetail(await careApi.patientCase(patientId, caseId));
      } catch (caught) {
        setError(
          caught instanceof Error ? caught.message : "Could not load journey.",
        );
      }
    })();
  }, [caseId]);

  if (error !== "") {
    return (
      <View className="flex-1 gap-2 bg-background p-4">
        <Text className="text-destructive">{error}</Text>
      </View>
    );
  }

  if (detail === null) {
    return (
      <View className="flex-1 items-center justify-center gap-2 bg-background">
        <ActivityIndicator />
        <Text className="text-muted-foreground">Loading your journey…</Text>
      </View>
    );
  }

  const current = stepIndex(detail.journeyStage);
  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerClassName="gap-5 p-4 pb-12"
    >
      <View className="gap-1">
        <Text variant="h3">Care journey</Text>
        <Text className="text-muted-foreground">{journeyHint(detail)}</Text>
      </View>
      {stepRows(detail).map((row, index) => {
        const done = index <= current;
        return (
          <View key={row.step} className="flex-row gap-3">
            <View className="items-center">
              <View
                className={
                  done
                    ? "size-8 items-center justify-center rounded-full bg-primary"
                    : "size-8 items-center justify-center rounded-full border border-border"
                }
              >
                <Icon
                  as={done ? Check : Clock}
                  className={
                    done
                      ? "size-4 text-primary-foreground"
                      : "size-4 text-muted-foreground"
                  }
                />
              </View>
              {index < 3 ? <View className="w-px flex-1 bg-border" /> : null}
            </View>
            <View className="flex-1 gap-1 pb-4">
              <Text
                className={done ? "font-semibold" : "text-muted-foreground"}
              >
                {journeyLabel(row.step)}
              </Text>
              <Text className="text-sm text-muted-foreground">
                {row.detail}
              </Text>
              {row.when === null ? null : (
                <Text className="text-xs text-muted-foreground">
                  {row.when}
                </Text>
              )}
            </View>
          </View>
        );
      })}
      <Text className="text-xs text-muted-foreground">
        Reminders arrive 24 hours before your visit. Your care team sees every
        step of this timeline.
      </Text>
    </ScrollView>
  );
};

export default Journey;
