import { useLocalSearchParams } from "expo-router";
import { BellRing, Route } from "lucide-react-native";
import { ScrollView, View } from "react-native";
import {
  JourneyTimeline,
  STEP_ICON,
} from "@/components/journey/journey-timeline";
import { TabScreen } from "@/components/layout/tab-screen";
import { Icon } from "@/components/ui/icon";
import { IconTile } from "@/components/ui/list";
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
          <View className="flex-1 items-center gap-2 p-8">
            <IconTile tone="muted">
              <Icon as={Route} className="size-[18px] text-muted-foreground" />
            </IconTile>
            <Text className="text-[16px] font-semibold">No journey yet</Text>
            <Text className="text-center text-[13px] leading-[19px] text-muted-foreground">
              Your timeline starts when your first result arrives.
            </Text>
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
  const StepMark =
    currentRow === undefined ? Route : STEP_ICON[currentRow.step];
  const progress = Math.round(((step + 1) / rows.length) * 100);

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
          icon={<Icon as={Route} className="size-[22px] text-primary" />}
        />
        <View className="gap-5 px-5">
          <View className="gap-3 rounded-[18px] border border-border/70 bg-card p-4">
            <View className="flex-row items-center gap-3">
              <View className="size-11 items-center justify-center rounded-[13px] bg-primary/15">
                <Icon as={StepMark} className="size-[20px] text-primary" />
              </View>
              <View className="flex-1 gap-0.5">
                <Text className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
                  Current step
                </Text>
                <Text className="text-[17px] font-bold leading-[22px]">
                  {currentRow === undefined
                    ? ""
                    : journeyLabel(currentRow.step)}
                </Text>
              </View>
              <Text className="text-[12px] font-bold text-muted-foreground">
                {`${step + 1}/${rows.length}`}
              </Text>
            </View>
            <View className="h-1.5 overflow-hidden rounded-full bg-secondary">
              <View
                className="h-full rounded-full bg-primary"
                style={{ width: `${progress}%` }}
              />
            </View>
          </View>

          <JourneyTimeline rows={rows} current={step} />

          <View className="flex-row items-center gap-2 px-1">
            <Icon as={BellRing} className="size-[14px] text-muted-foreground" />
            <Text className="flex-1 text-[12px] leading-[17px] text-muted-foreground">
              A reminder arrives 24 hours before your visit.
            </Text>
          </View>
        </View>
      </ScrollView>
    </TabScreen>
  );
};

export default Journey;
