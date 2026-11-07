import type { PatientCase } from "@hermes/types";
import * as Notifications from "expo-notifications";
import { useFocusEffect, useRouter } from "expo-router";
import { HeartPulse, RefreshCw } from "lucide-react-native";
import * as React from "react";
import {
  ActivityIndicator,
  Platform,
  RefreshControl,
  ScrollView,
  View,
} from "react-native";
import { BiometricGate } from "@/components/care/biometric-gate";
import { ResultRow } from "@/components/care/result-row";
import { TabScreen } from "@/components/layout/tab-screen";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { IconTile, ListSection } from "@/components/ui/list";
import { ScreenHeader } from "@/components/ui/screen-header";
import { Text } from "@/components/ui/text";
import { getCachedPatient, loadPatientProfile } from "@/lib/auth";
import { careApi } from "@/lib/care-api";
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
      // A transient network failure must not sign the patient out; fall back
      // to the profile cached at sign-in when the refresh cannot reach the API.
      const profile =
        (await loadPatientProfile().catch(() => null)) ??
        (await getCachedPatient());
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

  // Messages and closures happen on other screens; refresh whenever the
  // patient returns to the home tab so status and unread counts stay honest.
  useFocusEffect(
    React.useCallback(() => {
      if (patientId !== null) void load(patientId);
    }, [load, patientId]),
  );

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

  const open = cases.filter((item) => item.careCase.status !== "closed");
  const closed = cases.filter((item) => item.careCase.status === "closed");

  return (
    <BiometricGate>
      <TabScreen>
        <ScrollView
          className="flex-1 bg-background"
          contentContainerClassName="gap-5 pb-12"
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
          <ScreenHeader
            eyebrow="Blood results"
            title="Your care loop"
            subtitle="Screening results, bookings and follow-up in one place."
          />

          {patientId === null ? null : (
            <View className="mx-4 flex-row items-center justify-between rounded-[18px] bg-card p-4">
              <View className="flex-1 gap-1">
                <Text className="text-[12px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Signed in
                </Text>
                <Text className="text-[15px] font-semibold">
                  {patientLabel === "" ? patientId : patientLabel}
                </Text>
              </View>
              <View className="size-2.5 rounded-full bg-success" />
            </View>
          )}

          {loading ? (
            <View className="items-center gap-2 py-16">
              <ActivityIndicator />
              <Text className="text-[13px] text-muted-foreground">
                Loading your results…
              </Text>
            </View>
          ) : null}

          {error === "" ? null : (
            <View className="mx-4 gap-3 rounded-[16px] border border-destructive/40 bg-destructive/5 p-4">
              <Text className="text-[15px] font-semibold">
                We could not reach your clinic.
              </Text>
              <Text className="text-[13px] leading-[19px] text-muted-foreground">
                {error}
              </Text>
              <Button
                variant="outline"
                onPress={() => {
                  setLoading(true);
                  if (patientId !== null) void load(patientId);
                }}
              >
                <Icon as={RefreshCw} className="size-4" />
                <Text>Try again</Text>
              </Button>
            </View>
          )}

          {loading || error !== "" ? null : cases.length === 0 ? (
            <View className="mx-4 items-center gap-2 rounded-[18px] border border-dashed border-border px-6 py-10">
              <IconTile tone="muted">
                <Icon
                  as={HeartPulse}
                  className="size-[18px] text-muted-foreground"
                />
              </IconTile>
              <Text className="text-[16px] font-semibold">
                No screening updates yet
              </Text>
              <Text className="text-center text-[13px] leading-[19px] text-muted-foreground">
                When a partner lab sends a result, it appears here and we send
                you a secure push notification.
              </Text>
            </View>
          ) : (
            <>
              {open.length === 0 ? null : (
                <ListSection
                  title="Needs attention"
                  footer="Tap a result to see what it means and choose a next step."
                >
                  {open.map((item, index) => (
                    <ResultRow
                      key={item.careCase.id}
                      item={item}
                      first={index === 0}
                      onPress={() =>
                        router.push({
                          pathname: "/care-action",
                          params: { caseId: item.careCase.id },
                        })
                      }
                    />
                  ))}
                </ListSection>
              )}

              {closed.length === 0 ? null : (
                <ListSection title="Past results">
                  {closed.map((item, index) => (
                    <ResultRow
                      key={item.careCase.id}
                      item={item}
                      first={index === 0}
                      onPress={() =>
                        router.push({
                          pathname: "/care-action",
                          params: { caseId: item.careCase.id },
                        })
                      }
                    />
                  ))}
                </ListSection>
              )}
            </>
          )}
        </ScrollView>
      </TabScreen>
    </BiometricGate>
  );
};

export default HomeScreen;
