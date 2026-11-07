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
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { careApi, type PatientNotification } from "@/lib/care-api";
import { formatDateTime } from "@/lib/case-format";
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

  return (
    <TabScreen>
      <ScrollView
        className="flex-1 bg-background"
        contentContainerClassName="gap-3 p-4 pb-12"
      >
        <View className="flex-row items-center gap-2">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Back to profile"
            hitSlop={8}
            onPress={() =>
              router.canGoBack() ? router.back() : router.replace("/profile")
            }
          >
            <Icon as={ChevronLeft} className="size-5 text-foreground" />
          </Pressable>
          <Text variant="h3">Notifications</Text>
        </View>
        <Text className="text-sm text-muted-foreground">
          Result alerts, visit reminders and secure messages from your care
          team.
        </Text>

        {loading ? (
          <View className="items-center gap-2 py-10">
            <ActivityIndicator />
            <Text className="text-muted-foreground">Loading alerts…</Text>
          </View>
        ) : null}

        {error === "" ? null : (
          <Text className="text-sm text-destructive">{error}</Text>
        )}

        {!loading && error === "" && items.length === 0 ? (
          <View className="items-center gap-2 rounded-xl border border-border p-6">
            <Icon as={Bell} className="size-8 text-muted-foreground" />
            <Text className="font-medium">No notifications yet</Text>
            <Text className="text-center text-sm text-muted-foreground">
              When your clinic sends an update, it will appear here.
            </Text>
          </View>
        ) : null}

        {items.map((item) => {
          const unread = item.readAt === null;
          return (
            <Pressable
              key={item.id}
              className={
                unread
                  ? "gap-2 rounded-xl border border-primary/30 bg-secondary p-4"
                  : "gap-2 rounded-xl border border-border bg-card p-4"
              }
              onPress={() => {
                void open(item);
              }}
            >
              <View className="flex-row items-center justify-between gap-2">
                <View className="flex-row items-center gap-2">
                  <Icon
                    as={KIND_ICON[item.kind]}
                    className="size-4 text-primary"
                  />
                  <Text className="font-medium">{KIND_LABEL[item.kind]}</Text>
                </View>
                {unread ? (
                  <View className="size-2 rounded-full bg-primary" />
                ) : null}
              </View>
              <Text className="text-xs text-muted-foreground">
                {formatDateTime(item.createdAt)} ·{" "}
                {item.status === "failed" ? "Not delivered" : "Delivered"}
              </Text>
              {item.caseId === "" ? null : (
                <Text className="text-sm text-muted-foreground">
                  Open your result for the full details.
                </Text>
              )}
            </Pressable>
          );
        })}

        <Button variant="ghost" onPress={() => router.back()}>
          <Text>Back to profile</Text>
        </Button>
      </ScrollView>
    </TabScreen>
  );
};

export default Notifications;
