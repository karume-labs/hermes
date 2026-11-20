import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { env } from "@/lib/env/index";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export const hasNotificationPermission = async (): Promise<boolean> => {
  if (Platform.OS === "web") return false;
  const { status } = await Notifications.getPermissionsAsync();
  return status === "granted";
};

/** Asks the OS once; the answer is sticky, so onboarding is the one place it asks. */
export const requestNotificationPermission = async (): Promise<boolean> => {
  if (Platform.OS === "web") return false;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === "granted";
};

/**
 * Android 13+ blocks notifications until the app asks, and onboarding is the
 * only other place that asks, so a patient who skipped it would otherwise get
 * a switch that claims push is on while nothing ever arrives.
 */
export const ensurePushPermission = async (
  wanted: boolean,
  alreadyOn: boolean,
): Promise<boolean> => {
  if (!wanted || alreadyOn) return wanted;
  return requestNotificationPermission().catch(() => false);
};

export const registerPushToken = async (): Promise<string | null> => {
  if (Platform.OS === "web") return null;
  const projectId = env.easProjectId;
  if (projectId === undefined) return null;
  try {
    const { status: existing } = await Notifications.getPermissionsAsync();
    const status =
      existing === "granted"
        ? existing
        : (await Notifications.requestPermissionsAsync()).status;
    if (status !== "granted") return null;
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("care-loop", {
        name: "Care Loop",
        importance: Notifications.AndroidImportance.HIGH,
      });
    }
    const token = await Notifications.getExpoPushTokenAsync({ projectId });
    return token.data;
  } catch (error) {
    console.warn("Push registration skipped", error);
    return null;
  }
};

const VISIT_REMINDER_KIND = "visit_reminder";

/** Rescheduling replaces the reminder the same way it replaces the calendar event. */
export const cancelVisitReminder = async (): Promise<void> => {
  if (Platform.OS === "web") return;
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(
    scheduled
      .filter(
        (item) =>
          (item.content.data as { kind?: string } | null)?.kind ===
          VISIT_REMINDER_KIND,
      )
      .map((item) =>
        Notifications.cancelScheduledNotificationAsync(item.identifier),
      ),
  );
};

export const scheduleVisitReminder = async (at: Date): Promise<string> => {
  await cancelVisitReminder().catch(() => undefined);
  if (at.getTime() <= Date.now()) {
    return "";
  }
  return Notifications.scheduleNotificationAsync({
    content: {
      title: "Visit tomorrow",
      body: "Your confirmatory visit is coming up. Bring prior labs and arrive 15 minutes early.",
      data: { kind: VISIT_REMINDER_KIND },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: at,
    },
  });
};
