import type { NotificationPreference } from "@hermes/types";
import * as React from "react";
import { useUpdateConsent } from "@/lib/api/queries";
import { ensurePushPermission, registerPushToken } from "@/lib/notifications";

interface ConsentState {
  pushConsent: boolean;
  emailConsent: boolean;
  notificationChannel: NotificationPreference;
}

const BLOCKED =
  "Notifications are blocked for Hermes Care. Turn them on in your phone settings.";

/** Push consent plus the OS permission Android 13+ needs before anything shows. */
export const usePushConsent = (current: ConsentState | null) => {
  const updateConsent = useUpdateConsent();
  const [notice, setNotice] = React.useState("");

  const save = (input: {
    pushConsent: boolean;
    smsConsent: boolean;
    emailConsent: boolean;
    notificationChannel: NotificationPreference;
  }): void => updateConsent.mutate(input);

  const setPush = async (
    pushConsent: boolean,
    smsConsent: boolean,
  ): Promise<void> => {
    const allowed = await ensurePushPermission(
      pushConsent,
      current?.pushConsent === true,
    );
    setNotice(pushConsent && !allowed ? BLOCKED : "");
    if (allowed) void registerPushToken();
    save({
      pushConsent: allowed,
      smsConsent,
      emailConsent: current?.emailConsent ?? false,
      notificationChannel: current?.notificationChannel ?? "in_app",
    });
  };

  const setChannel = (notificationChannel: NotificationPreference): void =>
    save({
      pushConsent: current?.pushConsent ?? true,
      smsConsent: false,
      emailConsent: notificationChannel !== "in_app",
      notificationChannel,
    });

  return {
    notice,
    pending: updateConsent.isPending,
    error: updateConsent.error,
    setPush,
    setChannel,
  };
};
