import { useRouter } from "expo-router";
import { Bell, ChevronLeft } from "lucide-react-native";
import { Pressable, ScrollView, View } from "react-native";
import { TabScreen } from "@/components/layout/tab-screen";
import { NotificationGroupList } from "@/components/notifications/notification-group-list";
import { Icon } from "@/components/ui/icon";
import { IconTile } from "@/components/ui/list";
import { ScreenSkeleton } from "@/components/ui/screen-skeleton";
import { Text } from "@/components/ui/text";
import {
  useMarkNotificationRead,
  usePatientNotifications,
} from "@/lib/api/queries";
import { groupByDay } from "@/lib/notification-groups";

const Notifications = () => {
  const router = useRouter();
  const notifications = usePatientNotifications();
  const markRead = useMarkNotificationRead();
  const items = notifications.data ?? [];
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

        {notifications.isPending ? (
          <ScreenSkeleton rows={4} withHeader={false} />
        ) : null}

        {notifications.error !== null ? (
          <Text className="px-5 text-[13px] text-destructive">
            {notifications.error.message}
          </Text>
        ) : null}

        {!notifications.isPending &&
        notifications.error === null &&
        items.length === 0 ? (
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
            if (item.readAt === null) markRead.mutate(item.id);
            if (item.caseId !== "") {
              router.push({
                pathname: "/care-action",
                params: { caseId: item.caseId },
              });
            }
          }}
        />
      </ScrollView>
    </TabScreen>
  );
};

export default Notifications;
