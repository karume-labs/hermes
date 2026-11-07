import type { PatientCase } from "@hermes/types";
import { useFocusEffect, useRouter } from "expo-router";
import * as React from "react";
import { Platform } from "react-native";
import {
  getCachedPatient,
  loadPatientProfile,
  type PatientProfile,
} from "@/lib/auth";
import { careApi } from "@/lib/care-api";
import { registerPushToken } from "@/lib/notifications";
import { addNotificationTapListener } from "@/lib/push-tap";
import { trackEvent } from "@/lib/session";

type HomeState = {
  patientId: string | null;
  patientLabel: string;
  cases: PatientCase[];
  error: string;
  loading: boolean;
  refreshing: boolean;
};

const initialState: HomeState = {
  patientId: null,
  patientLabel: "",
  cases: [],
  error: "",
  loading: true,
  refreshing: false,
};

export const useHomeCases = () => {
  const router = useRouter();
  const [state, setState] = React.useState<HomeState>(initialState);
  const [_tick, setTick] = React.useState(0);

  const reload = React.useCallback(() => {
    setTick((value) => value + 1);
  }, []);

  const load = React.useCallback(async (id: string): Promise<void> => {
    try {
      setState((current) => ({ ...current, error: "" }));
      const cases = await careApi.patientCases(id);
      setState((current) => ({ ...current, cases }));
    } catch (caught) {
      setState((current) => ({
        ...current,
        error:
          caught instanceof Error
            ? caught.message
            : "Could not load your care.",
      }));
    } finally {
      setState((current) => ({
        ...current,
        loading: false,
        refreshing: false,
      }));
    }
  }, []);

  React.useEffect(() => {
    void (async () => {
      // A transient network failure must not sign the patient out; fall back
      // to the profile cached at sign-in when the refresh cannot reach the API.
      const fresh = await loadPatientProfile().catch(() => null);
      const profile: PatientProfile | null =
        fresh === null ? await getCachedPatient() : fresh;
      if (profile === null) {
        router.replace("/sign-in");
        return;
      }
      setState((current) => ({
        ...current,
        patientId: profile.id,
        patientLabel: `${profile.name} · ${profile.clinicName}`,
      }));
      trackEvent(profile.id, "app_open");
      await registerDevice(profile.id);
      await load(profile.id);
    })();
  }, [load, router]);

  // Messages and closures happen on other screens; refresh whenever the
  // patient returns to the home tab so status and unread counts stay honest.
  useFocusEffect(
    React.useCallback(() => {
      if (state.patientId !== null) void load(state.patientId);
    }, [load, state.patientId]),
  );

  React.useEffect(() => {
    const subscription = addNotificationTapListener(router);
    return () => {
      subscription.remove();
    };
  }, [router]);

  const refresh = (): void => {
    setState((current) => ({ ...current, refreshing: true }));
    reload();
  };

  const retry = (): void => {
    setState((current) => ({ ...current, loading: true }));
    reload();
  };

  return { ...state, refresh, retry };
};

const registerDevice = async (patientId: string): Promise<void> => {
  const token = await registerPushToken();
  if (token === null) return;
  await careApi
    .registerDevice(patientId, token, Platform.OS)
    .catch((caught: unknown) => {
      console.warn("Device registration failed", caught);
    });
};
