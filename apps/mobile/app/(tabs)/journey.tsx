import { useLocalSearchParams } from "expo-router";
import { ScrollView, View } from "react-native";
import { JourneyTimeline } from "@/components/journey/journey-timeline";
import { TabScreen } from "@/components/layout/tab-screen";
import { ScreenHeader } from "@/components/ui/screen-header";
import { ScreenSkeleton } from "@/components/ui/screen-skeleton";
import { Text } from "@/components/ui/text";
import { usePatientCase, usePatientCases } from "@/lib/api/queries";
import { stepIndex } from "@/lib/care-store";
import { journeyHint, journeyLabel } from "@/lib/case-format";
import { stepRows } from "@/lib/journey-steps";
import { paramString } from "@/lib/params";

const Journey = () => {
  const params = useLocalSearchParams<{ caseId?: string }>();
  const cases = usePatientCases();
  const caseId =
    paramString(params.caseId) ?? cases.data?.[0]?.careCase.id ?? undefined;
  const detail = usePatientCase(caseId);
  const current = detail.data;

  if (detail.error !== null) {
    return (
      <TabScreen>
        <View className="flex-1 gap-2 p-4">
          <Text className="text-destructive">{detail.error.message}</Text>
        </View>
      </TabScreen>
    );
  }

  if (current === undefined) {
    if (!cases.isPending && (cases.data ?? []).length === 0) {
      return (
        <TabScreen>
          <View className="flex-1 gap-2 p-4">
            <Text className="text-muted-foreground">No care journey yet.</Text>
          </View>
        </TabScreen>
      );
    }
    return (
      <TabScreen>
        <ScreenSkeleton rows={5} />
      </TabScreen>
    );
  }

  const step = stepIndex(current.journeyStage);
  const rows = stepRows(current);
  const currentRow = rows[step];
  return (
    <TabScreen>
      <ScrollView
        className="flex-1 bg-background"
        contentContainerClassName="gap-5 pb-12"
      >
        <ScreenHeader
          eyebrow="Care journey"
          title="Your timeline"
          subtitle={journeyHint(current)}
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
          <JourneyTimeline rows={rows} current={step} />
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
