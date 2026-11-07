import { useRouter } from "expo-router";
import { Bell, Lock, ShieldCheck } from "lucide-react-native";
import * as React from "react";
import { ScrollView, Switch, View } from "react-native";
import { TabScreen } from "@/components/layout/tab-screen";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import {
  getCachedPatient,
  loadPatientProfile,
  signOutPatient,
  updateConsent,
} from "@/lib/auth";

const Profile = () => {
  const router = useRouter();
  const [profile, setProfile] = React.useState<Awaited<
    ReturnType<typeof loadPatientProfile>
  > | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    void (async () => {
      const current =
        (await loadPatientProfile().catch(() => null)) ??
        (await getCachedPatient());
      setProfile(current);
    })();
  }, []);

  const setConsent = async (
    pushConsent: boolean,
    smsConsent: boolean,
  ): Promise<void> => {
    if (profile === null) return;
    setSaving(true);
    setError("");
    try {
      setProfile(await updateConsent(pushConsent, smsConsent));
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Could not save your preferences.",
      );
    } finally {
      setSaving(false);
    }
  };

  const signOut = async (): Promise<void> => {
    await signOutPatient();
    router.replace("/sign-in");
  };

  return (
    <TabScreen>
      <ScrollView
        className="flex-1 bg-background"
        contentContainerClassName="gap-4 p-4 pb-12"
      >
        <View className="items-center gap-2 py-4">
          <View className="size-20 items-center justify-center rounded-full bg-primary">
            <Text className="text-2xl font-bold text-primary-foreground">
              {profile === null
                ? "HC"
                : profile.name
                    .split(" ")
                    .map((part) => part[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase()}
            </Text>
          </View>
          <Text variant="h3">
            {profile === null ? "Your profile" : profile.name}
          </Text>
          <Text className="text-sm text-muted-foreground">
            {profile === null ? "" : `${profile.clinicName} · ${profile.phone}`}
          </Text>
        </View>

        {error === "" ? null : (
          <Text className="text-sm text-destructive">{error}</Text>
        )}

        <View className="gap-3 rounded-xl border border-border bg-card p-4">
          <Text className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Contact and identity
          </Text>
          <View className="flex-row items-center justify-between gap-3">
            <Text className="text-sm text-muted-foreground">Patient ID</Text>
            <Text className="text-sm">
              {profile === null ? "—" : profile.id}
            </Text>
          </View>
          <View className="flex-row items-center justify-between gap-3">
            <Text className="text-sm text-muted-foreground">Phone</Text>
            <Text className="text-sm">
              {profile === null ? "—" : profile.phone}
            </Text>
          </View>
          <View className="flex-row items-center justify-between gap-3">
            <Text className="text-sm text-muted-foreground">Clinic</Text>
            <Text className="text-sm">
              {profile === null ? "—" : profile.clinicName}
            </Text>
          </View>
        </View>

        <View className="gap-3 rounded-xl border border-border bg-card p-4">
          <Text className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Notifications
          </Text>
          <View className="flex-row items-center justify-between gap-3">
            <View className="flex-1 gap-0.5">
              <Text className="font-medium">Push notifications</Text>
              <Text className="text-xs text-muted-foreground">
                New results, visit reminders and secure messages.
              </Text>
            </View>
            <Switch
              value={profile?.pushConsent === true}
              disabled={profile === null || saving}
              onValueChange={(value) => {
                if (profile === null) return;
                void setConsent(value, profile.smsConsent);
              }}
            />
          </View>
          <View className="flex-row items-center justify-between gap-3">
            <View className="flex-1 gap-0.5">
              <Text className="font-medium">SMS fallback</Text>
              <Text className="text-xs text-muted-foreground">
                Text alerts when push cannot reach your phone.
              </Text>
            </View>
            <Switch
              value={profile?.smsConsent === true}
              disabled={profile === null || saving}
              onValueChange={(value) => {
                if (profile === null) return;
                void setConsent(profile.pushConsent, value);
              }}
            />
          </View>
          <Button
            variant="outline"
            onPress={() => router.push("/notifications")}
          >
            <Icon as={Bell} className="size-4" />
            <Text>Open notifications</Text>
          </Button>
        </View>

        <View className="gap-2 rounded-xl border border-border p-4">
          <View className="flex-row items-center gap-2">
            <Icon as={Lock} className="size-4 text-muted-foreground" />
            <Text className="font-medium">Privacy and security</Text>
          </View>
          <Text className="text-sm text-muted-foreground">
            Messages are encrypted in transit and stored with your case file.
            Your result never appears in a notification body.
          </Text>
          <View className="flex-row items-center gap-2">
            <Icon as={ShieldCheck} className="size-4 text-muted-foreground" />
            <Text className="text-xs text-muted-foreground">
              Unlock with your fingerprint when you open a result.
            </Text>
          </View>
        </View>

        <Button variant="outline" onPress={signOut}>
          <Text>Sign out</Text>
        </Button>
      </ScrollView>
    </TabScreen>
  );
};

export default Profile;
