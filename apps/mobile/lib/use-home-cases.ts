import { useFocusEffect, useRouter } from "expo-router";
import * as React from "react";
import { Platform } from "react-native";
import {
  usePatientCases,
  usePatientProfile,
  useRecordEvent,
  useRegisterDevice,
} from "@/lib/api/queries";
import { registerPushToken } from "@/lib/notifications";
import { addNotificationTapListener } from "@/lib/push-tap";

const messageOf = (error: unknown, fallback: string): string =>
  error instanceof Error ? error.message : fallback;

export const useHomeCases = () => {
  const router = useRouter();
  const profile = usePatientProfile();
  const cases = usePatientCases();
  const device = useRegisterDevice();
  const recordEvent = useRecordEvent();
  const patientId = profile.data?.id ?? null;

  // One registration per signed-in patient, not per render.
  React.useEffect(() => {
    if (patientId === null) return;
    recordEvent.mutate({ type: "app_open" });
    void registerPushToken().then((token) => {
      if (token === null) return;
      device.mutate({ token, platform: Platform.OS });
    });
  }, [patientId, recordEvent.mutate, device.mutate]);

  // Messages and closures happen on other screens; refresh whenever the
  // patient returns to the home tab so status and unread counts stay honest.
  useFocusEffect(
    React.useCallback(() => {
      void cases.refetch();
    }, [cases.refetch]),
  );

  React.useEffect(() => {
    const subscription = addNotificationTapListener(router);
    return () => {
      subscription.remove();
    };
  }, [router]);

  const clinicName = profile.data?.clinicName ?? "No clinic linked yet";
  return {
    patientId,
    patientLabel:
      profile.data === undefined ? "" : `${profile.data.name} · ${clinicName}`,
    cases: cases.data ?? [],
    error:
      profile.error !== null
        ? messageOf(profile.error, "Could not load your care.")
        : cases.error !== null
          ? messageOf(cases.error, "Could not load your care.")
          : "",
    loading: profile.isPending || cases.isPending,
    refreshing: cases.isRefetching,
    refresh: () => {
      void cases.refetch();
    },
    retry: () => {
      void profile.refetch();
      void cases.refetch();
    },
  };
};
