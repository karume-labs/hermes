import { useFocusEffect, useRouter } from "expo-router";
import { Bell, ChevronLeft } from "lucide-react-native";
import * as React from "react";
import { Pressable, ScrollView, View } from "react-native";
import { TabScreen } from "@/components/layout/tab-screen";
import { NotificationGroupList } from "@/components/notifications/notification-group-list";
import { Icon } from "@/components/ui/icon";
import { IconTile } from "@/components/ui/list";
import { ScreenSkeleton } from "@/components/ui/screen-skeleton";
import { Text } from "@/components/ui/text";
import { careApi, type PatientNotification } from "@/lib/care-api";
import { groupByDay } from "@/lib/notification-groups";
import { getPatientId } from "@/lib/session";

const Notifications = () => {
  const router = useRouter();
  const [patientId, setPatientId] = React.useState<string | null>(null);
  const [items, setItems] = React.useState<PatientNotification[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");

  const load = React.useCallback(async (id: string): Promise<void> => {
    try {
      setError("");
      setItems(await careApi.notifications(id));
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Could not load notifications.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      void (async () => {
        const id = await getPatientId();
        setPatientId(id);
        await load(id);
      })();
    }, [load]),
  );

  const open = async (item: PatientNotification): Promise<void> => {
    if (patientId === null) return;
    if (item.readAt === null) {
      try {
        await careApi.markNotificationRead(patientId, item.id);
        setItems((current) =>
          current.map((entry) =>
            entry.id === item.id
              ? { ...entry, readAt: new Date().toISOString() }
              : entry,
          ),
        );
      } catch (caught) {
        setError(
          caught instanceof Error
            ? caught.message
            : "Could not mark this notification read.",
        );
      }
    }
    if (item.caseId !== "") {
      router.push({
        pathname: "/care-action",
        params: { caseId: item.caseId },
      });
    }
  };

  const groups = groupByDay(items);

  return (
    <TabScreen>
      <ScrollView
        className="flex-1 bg-background"
        contentContainerClassName="gap-5 pb-12"
      >
        <View className="flex-row items-center px-2 pt-1">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Back to profile"
            hitSlop={8}
            className="size-10 items-center justify-center rounded-full active:bg-secondary/60"
            onPress={() =>
              router.canGoBack() ? router.back() : router.replace("/profile")
            }
          >
            <Icon as={ChevronLeft} className="size-6 text-foreground" />
          </Pressable>
          <Text className="flex-1 text-center text-[16px] font-semibold">
            Notifications
          </Text>
          <View className="size-10" />
        </View>

        <Text className="px-5 text-[13px] leading-[19px] text-muted-foreground">
          Result alerts, visit reminders and secure messages from your care
          team.
        </Text>

        {loading ? <ScreenSkeleton rows={4} withHeader={false} /> : null}

        {error === "" ? null : (
          <Text className="px-5 text-[13px] text-destructive">{error}</Text>
        )}

        {!loading && error === "" && items.length === 0 ? (
          <View className="mx-4 items-center gap-2 rounded-[18px] border border-dashed border-border px-6 py-10">
            <IconTile tone="muted">
              <Icon as={Bell} className="size-[18px] text-muted-foreground" />
            </IconTile>
            <Text className="text-[16px] font-semibold">
              No notifications yet
            </Text>
            <Text className="text-center text-[13px] leading-[19px] text-muted-foreground">
              When your clinic sends an update, it will appear here.
            </Text>
          </View>
        ) : null}

        <NotificationGroupList
          groups={groups}
          onOpen={(item) => {
            void open(item);
          }}
        />
      </ScrollView>
    </TabScreen>
  );
};

export default Notifications;
