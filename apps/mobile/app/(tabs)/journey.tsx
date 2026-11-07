import { useLocalSearchParams } from "expo-router";
import * as React from "react";
import { ActivityIndicator, ScrollView, View } from "react-native";
import { JourneyTimeline } from "@/components/journey/journey-timeline";
import { TabScreen } from "@/components/layout/tab-screen";
import { ScreenHeader } from "@/components/ui/screen-header";
import { Text } from "@/components/ui/text";
import { careApi, type PatientCaseDetail } from "@/lib/care-api";
import { stepIndex } from "@/lib/care-store";
import { journeyHint, journeyLabel } from "@/lib/case-format";
import { stepRows } from "@/lib/journey-steps";
import { paramString } from "@/lib/params";
import { getPatientId } from "@/lib/session";

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
      <TabScreen>
        <View className="flex-1 gap-2 p-4">
          <Text className="text-destructive">{error}</Text>
        </View>
      </TabScreen>
    );
  }

  if (detail === null) {
    return (
      <TabScreen>
        <View className="flex-1 items-center justify-center gap-2">
          <ActivityIndicator />
          <Text className="text-muted-foreground">Loading your journey…</Text>
        </View>
      </TabScreen>
    );
  }

  const current = stepIndex(detail.journeyStage);
  const rows = stepRows(detail);
  const currentRow = rows[current];
  return (
    <TabScreen>
      <ScrollView
        className="flex-1 bg-background"
        contentContainerClassName="gap-5 pb-12"
      >
        <ScreenHeader
          eyebrow="Care journey"
          title="Your timeline"
          subtitle={journeyHint(detail)}
        />
        <View className="gap-5 px-5">
          <View className="gap-1 rounded-[18px] bg-card p-4">
            <Text className="text-[12px] font-semibold uppercase tracking-wide text-muted-foreground">
              Current step
            </Text>
            <Text className="text-[17px] font-bold">
              {currentRow === undefined ? "" : journeyLabel(currentRow.step)}
            </Text>
          </View>
          <JourneyTimeline rows={rows} current={current} />
          <Text className="text-xs text-muted-foreground">
            Reminders arrive 24 hours before your visit. Your care team sees
            every step of this timeline.
          </Text>
        </View>
      </ScrollView>
    </TabScreen>
  );
};

export default Journey;
