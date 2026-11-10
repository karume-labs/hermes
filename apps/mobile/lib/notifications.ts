import Constants from "expo-constants";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

const pushProjectId = (): string | undefined => {
  const eas = Constants.expoConfig?.extra?.eas;
  if (eas === undefined || eas === null || typeof eas !== "object") {
    return undefined;
  }
  const projectId = "projectId" in eas ? eas.projectId : undefined;
  return typeof projectId === "string" ? projectId : undefined;
};

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

export const registerPushToken = async (): Promise<string | null> => {
  if (Platform.OS === "web") return null;
  const projectId = pushProjectId();
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

export const scheduleVisitReminder = async (at: Date): Promise<string> => {
  if (at.getTime() <= Date.now()) {
    return "";
  }
  return Notifications.scheduleNotificationAsync({
    content: {
      title: "Visit tomorrow",
      body: "Your confirmatory visit is coming up. Bring prior labs and arrive 15 minutes early.",
      data: { kind: "visit_reminder" },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: at,
    },
  });
};
