import type { PatientCase } from "@hermes/types";
import * as Notifications from "expo-notifications";
import { useRouter } from "expo-router";
import { ChevronRight, HeartPulse, RefreshCw } from "lucide-react-native";
import * as React from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  View,
} from "react-native";
import { BiometricGate } from "@/components/care/biometric-gate";
import { SeverityPill } from "@/components/care/severity-pill";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { loadPatientProfile, signOutPatient } from "@/lib/auth";
import { careApi } from "@/lib/care-api";
import { journeyLabel, statusLabel } from "@/lib/case-format";
import { registerPushToken } from "@/lib/notifications";
import { getPatientId, trackEvent } from "@/lib/session";

const HomeScreen = () => {
  const router = useRouter();
  const [patientId, setPatientId] = React.useState<string | null>(null);
  const [patientLabel, setPatientLabel] = React.useState("");
  const [cases, setCases] = React.useState<PatientCase[]>([]);
  const [error, setError] = React.useState("");
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);

  const load = React.useCallback(async (id: string): Promise<void> => {
    try {
      setError("");
      setCases(await careApi.patientCases(id));
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Could not load your care.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  React.useEffect(() => {
    void (async () => {
      const profile = await loadPatientProfile().catch(() => null);
      if (profile === null) {
        router.replace("/sign-in");
        return;
      }
      setPatientId(profile.id);
      setPatientLabel(`${profile.name} · ${profile.clinicName}`);
      trackEvent(profile.id, "app_open");
      const token = await registerPushToken();
      if (token !== null) {
        await careApi
          .registerDevice(profile.id, token, Platform.OS)
          .catch((caught: unknown) =>
            console.warn("Device registration failed", caught),
          );
      }
      await load(profile.id);
    })();
  }, [load, router]);

  React.useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const data = response.notification.request.content.data;
        const caseId =
          data === undefined
            ? undefined
            : typeof data.caseId === "string"
              ? data.caseId
              : undefined;
        if (caseId !== undefined) {
          void (async () => {
            const id = await getPatientId();
            trackEvent(id, "push_opened", caseId);
          })();
          router.push({ pathname: "/care-action", params: { caseId } });
        }
      },
    );
    return () => subscription.remove();
  }, [router]);

  const signOut = async (): Promise<void> => {
    await signOutPatient();
    router.replace("/sign-in");
  };

  return (
    <BiometricGate>
      <ScrollView
        className="flex-1 bg-background"
        contentContainerClassName="gap-4 p-4 pb-10"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              if (patientId !== null) void load(patientId);
            }}
          />
        }
      >
        <View className="gap-1">
          <Text className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
            Blood results
          </Text>
          <Text variant="h3" className="text-[26px] leading-tight">
            Your care loop
          </Text>
          <Text className="text-sm text-muted-foreground">
            Screening results, bookings and follow-up in one place.
          </Text>
          {patientId === null ? null : (
            <View className="mt-2 flex-row items-center gap-2 self-start rounded-full border border-border bg-card px-3 py-1">
              <View className="h-1.5 w-1.5 rounded-full bg-success" />
              <Text className="text-xs text-muted-foreground">
                {patientLabel === "" ? patientId : patientLabel}
              </Text>
            </View>
          )}
        </View>

        {loading ? (
          <View className="items-center gap-2 py-10">
            <ActivityIndicator />
            <Text className="text-muted-foreground">Loading your results…</Text>
          </View>
        ) : null}

        {error === "" ? null : (
          <View className="gap-3 rounded-xl border border-destructive/40 bg-destructive/5 p-4">
            <Text className="font-medium">We could not reach your clinic.</Text>
            <Text className="text-sm text-muted-foreground">{error}</Text>
            <Button
              variant="outline"
              onPress={() => {
                setLoading(true);
                if (patientId !== null) void load(patientId);
              }}
            >
              <Icon as={RefreshCw} />
              <Text>Try again</Text>
            </Button>
          </View>
        )}

        {loading || error !== "" ? null : cases.length === 0 ? (
          <View className="items-center gap-2 rounded-xl border border-border p-6">
            <Icon as={HeartPulse} className="size-8 text-muted-foreground" />
            <Text className="font-medium">No screening updates yet</Text>
            <Text className="text-center text-sm text-muted-foreground">
              When a partner lab sends a result, it appears here and we send you
              a secure push notification.
            </Text>
          </View>
        ) : (
          <>
            <View className="mt-1 flex-row items-center justify-between">
              <Text className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                Latest results
              </Text>
              <Text className="text-xs text-muted-foreground">
                {cases.length} active
              </Text>
            </View>

            {cases.map((item) => (
              <Pressable
                key={item.careCase.id}
                className="gap-3 rounded-xl border border-border bg-card p-4 active:bg-accent"
                onPress={() =>
                  router.push({
                    pathname: "/care-action",
                    params: { caseId: item.careCase.id },
                  })
                }
              >
                <View className="flex-row items-center justify-between gap-2">
                  <SeverityPill severity={item.careCase.severity} />
                  <Text className="text-xs text-muted-foreground">
                    {statusLabel(item.careCase)}
                  </Text>
                </View>
                <Text className="font-medium">
                  {item.careCase.summaryPlainLanguage}
                </Text>
                <View className="flex-row items-center justify-between gap-2">
                  <Text className="text-xs text-muted-foreground">
                    {journeyLabel(item.journeyStage)}
                    {item.unreadMessages > 0
                      ? ` · ${item.unreadMessages} new message`
                      : ""}
                  </Text>
                  <Icon
                    as={ChevronRight}
                    className="size-4 text-muted-foreground"
                  />
                </View>
              </Pressable>
            ))}
          </>
        )}

        <View className="mt-2 flex-row justify-between gap-2">
          <Button
            variant="ghost"
            size="sm"
            onPress={() =>
              router.push({
                pathname: "/journey",
                params:
                  cases.length === 0 ? {} : { caseId: cases[0].careCase.id },
              })
            }
          >
            <Text>Care journey</Text>
          </Button>
          <Button variant="ghost" size="sm" onPress={signOut}>
            <Text>Sign out</Text>
          </Button>
        </View>
      </ScrollView>
    </BiometricGate>
  );
};

export default HomeScreen;
