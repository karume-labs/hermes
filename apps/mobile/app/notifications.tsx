import type { NotificationKind } from "@hermes/types";
import { useFocusEffect, useRouter } from "expo-router";
import {
  Bell,
  CalendarClock,
  ChevronLeft,
  MessageSquare,
  ShieldAlert,
} from "lucide-react-native";
import * as React from "react";
import { ActivityIndicator, Pressable, ScrollView, View } from "react-native";
import { TabScreen } from "@/components/layout/tab-screen";
import { Icon } from "@/components/ui/icon";
import { IconTile, ListRow, ListSection } from "@/components/ui/list";
import { Text } from "@/components/ui/text";
import { careApi, type PatientNotification } from "@/lib/care-api";
import { getPatientId } from "@/lib/session";

const KIND_LABEL: Record<NotificationKind, string> = {
  case_alert: "Result alert",
  sms_fallback: "SMS fallback",
  escalation: "Care team follow-up",
  secure_message: "Secure message",
  visit_reminder: "Visit reminder",
};

const KIND_ICON: Record<NotificationKind, typeof Bell> = {
  case_alert: ShieldAlert,
  sms_fallback: MessageSquare,
  escalation: ShieldAlert,
  secure_message: MessageSquare,
  visit_reminder: CalendarClock,
};

const timeLabel = (iso: string): string =>
  new Date(iso).toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });

const dayLabel = (iso: string): string => {
  const date = new Date(iso);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (date.toDateString() === today.toDateString()) return "Today";
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
  return date.toLocaleDateString(undefined, {
    weekday: "long",
    day: "numeric",
    month: "short",
  });
};

interface NotificationGroup {
  label: string;
  items: PatientNotification[];
}

const groupByDay = (items: PatientNotification[]): NotificationGroup[] =>
  items.reduce<NotificationGroup[]>((groups, item) => {
    const label = dayLabel(item.createdAt);
    const last = groups[groups.length - 1];
    if (last === undefined || last.label !== label) {
      groups.push({ label, items: [item] });
      return groups;
    }
    last.items.push(item);
    return groups;
  }, []);

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

        {loading ? (
          <View className="items-center gap-2 py-16">
            <ActivityIndicator />
            <Text className="text-[13px] text-muted-foreground">
              Loading alerts…
            </Text>
          </View>
        ) : null}

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

        {groups.map((group) => (
          <ListSection key={group.label} title={group.label}>
            {group.items.map((item, index) => {
              const unread = item.readAt === null;
              return (
                <ListRow
                  key={item.id}
                  first={index === 0}
                  leading={
                    <IconTile tone={unread ? "spark" : "muted"}>
                      <Icon
                        as={KIND_ICON[item.kind]}
                        className={
                          unread
                            ? "size-[18px] text-primary"
                            : "size-[18px] text-muted-foreground"
                        }
                      />
                    </IconTile>
                  }
                  title={KIND_LABEL[item.kind]}
                  subtitle={`${timeLabel(item.createdAt)} · ${
                    item.status === "failed" ? "Not delivered" : "Delivered"
                  }`}
                  trailing={
                    unread ? (
                      <View className="size-2 rounded-full bg-primary" />
                    ) : undefined
                  }
                  chevron={item.caseId !== ""}
                  onPress={() => {
                    void open(item);
                  }}
                />
              );
            })}
          </ListSection>
        ))}
      </ScrollView>
    </TabScreen>
  );
};

export default Notifications;
