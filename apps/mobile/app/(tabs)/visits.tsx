import { useRouter } from "expo-router";
import { CalendarCheck } from "lucide-react-native";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  View,
} from "react-native";
import { TabScreen } from "@/components/layout/tab-screen";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { IconTile } from "@/components/ui/list";
import { ScreenHeader } from "@/components/ui/screen-header";
import { Text } from "@/components/ui/text";
import { NextVisitPanel } from "@/components/visits/next-visit-panel";
import { VisitHistorySection } from "@/components/visits/visit-history-section";
import { useVisits } from "@/lib/use-visits";

const Visits = () => {
  const router = useRouter();
  const {
    loading,
    refreshing,
    error,
    cancelling,
    refresh,
    confirmCancel,
    next,
    later,
    past,
  } = useVisits();

  return (
    <TabScreen>
      <ScrollView
        className="flex-1 bg-background"
        contentContainerClassName="gap-5 pb-12"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refresh} />
        }
      >
        <ScreenHeader
          eyebrow="Appointments"
          title="Your visits"
          subtitle="Confirmed appointments, preparation notes and past visits in one place."
        />

        {loading ? (
          <View className="items-center gap-2 py-16">
            <ActivityIndicator />
            <Text className="text-[13px] text-muted-foreground">
              Loading your visits…
            </Text>
          </View>
        ) : null}

        {error === "" ? null : (
          <Text className="px-5 text-[13px] text-destructive">{error}</Text>
        )}

        {loading || error !== "" ? null : next === undefined ? (
          <View className="mx-4 items-center gap-2 rounded-[18px] border border-dashed border-border px-6 py-10">
            <IconTile tone="muted">
              <Icon
                as={CalendarCheck}
                className="size-[18px] text-muted-foreground"
              />
            </IconTile>
            <Text className="text-[16px] font-semibold">No upcoming visit</Text>
            <Text className="text-center text-[13px] leading-[19px] text-muted-foreground">
              Open a result and book a confirmatory visit when your care team
              asks for one.
            </Text>
            <Button
              variant="outline"
              className="mt-1"
              onPress={() => router.push("/")}
            >
              <Text>View your results</Text>
            </Button>
          </View>
        ) : (
          <NextVisitPanel
            next={next}
            later={later}
            cancelling={cancelling}
            onCancel={confirmCancel}
          />
        )}

        <VisitHistorySection past={past} />
      </ScrollView>
    </TabScreen>
  );
};

export default Visits;
