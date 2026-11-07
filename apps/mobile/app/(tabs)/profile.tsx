import { useRouter } from "expo-router";
import { Bell, Lock, LogOut, ShieldCheck } from "lucide-react-native";
import * as React from "react";
import { Pressable, ScrollView, Switch, View } from "react-native";
import { TabScreen } from "@/components/layout/tab-screen";
import { Icon } from "@/components/ui/icon";
import { IconTile, ListRow, ListSection } from "@/components/ui/list";
import { Text } from "@/components/ui/text";
import {
  getCachedPatient,
  loadPatientProfile,
  signOutPatient,
  updateConsent,
} from "@/lib/auth";
import {
  getThemePreference,
  setThemePreference,
  type ThemePreference,
} from "@/lib/theme-preference";

const THEME_OPTIONS: { value: ThemePreference; label: string }[] = [
  { value: "system", label: "System" },
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
];

const Profile = () => {
  const router = useRouter();
  const [profile, setProfile] = React.useState<Awaited<
    ReturnType<typeof loadPatientProfile>
  > | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState("");
  const [themePreference, setThemeChoice] =
    React.useState<ThemePreference>("system");

  React.useEffect(() => {
    void (async () => {
      const fresh = await loadPatientProfile().catch(() => null);
      const current = fresh === null ? await getCachedPatient() : fresh;
      setProfile(current);
      setThemeChoice(await getThemePreference());
    })();
  }, []);

  const chooseTheme = (preference: ThemePreference): void => {
    setThemeChoice(preference);
    void setThemePreference(preference);
  };

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

  const initials =
    profile === null
      ? "HC"
      : profile.name
          .split(" ")
          .map((part) => part[0])
          .join("")
          .slice(0, 2)
          .toUpperCase();

  return (
    <TabScreen>
      <ScrollView
        className="flex-1 bg-background"
        contentContainerClassName="gap-6 pb-12"
      >
        <View className="items-center gap-3 px-5 pt-6">
          <View className="size-[76px] items-center justify-center rounded-full bg-primary">
            <Text className="text-[26px] font-extrabold text-primary-foreground">
              {initials}
            </Text>
          </View>
          <View className="items-center gap-0.5">
            <Text className="text-[22px] font-bold leading-[28px]">
              {profile === null ? "Your profile" : profile.name}
            </Text>
            <Text className="text-[14px] text-muted-foreground">
              {profile === null
                ? ""
                : `${profile.clinicName} · ${profile.phone}`}
            </Text>
          </View>
        </View>

        {error === "" ? null : (
          <Text className="px-5 text-[13px] text-destructive">{error}</Text>
        )}

        <ListSection title="Account">
          <ListRow
            first
            title="Patient ID"
            value={profile === null ? "—" : profile.id}
          />
          <ListRow
            title="Phone"
            value={profile === null ? "—" : profile.phone}
          />
          <ListRow
            title="Clinic"
            value={profile === null ? "—" : profile.clinicName}
          />
        </ListSection>

        <ListSection
          title="Appearance"
          footer="System follows your phone's light or dark setting."
        >
          <View className="flex-row gap-2 px-4 py-3">
            {THEME_OPTIONS.map((option) => {
              const selected = themePreference === option.value;
              return (
                <Pressable
                  key={option.value}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                  onPress={() => {
                    chooseTheme(option.value);
                  }}
                  className={`flex-1 items-center rounded-control border py-2.5 ${
                    selected
                      ? "border-primary bg-primary/15"
                      : "border-border bg-card"
                  }`}
                >
                  <Text
                    className={`text-[14px] font-bold ${
                      selected ? "text-foreground" : "text-muted-foreground"
                    }`}
                  >
                    {option.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </ListSection>

        <ListSection
          title="Notifications"
          footer="Your result never appears in a notification body."
        >
          <ListRow
            first
            title="Push notifications"
            subtitle="New results, visit reminders and secure messages."
            trailing={
              <Switch
                value={profile?.pushConsent === true}
                disabled={profile === null || saving}
                onValueChange={(value) => {
                  if (profile === null) return;
                  void setConsent(value, profile.smsConsent);
                }}
              />
            }
          />
          <ListRow
            title="SMS fallback"
            subtitle="Text alerts when push cannot reach you."
            trailing={
              <Switch
                value={profile?.smsConsent === true}
                disabled={profile === null || saving}
                onValueChange={(value) => {
                  if (profile === null) return;
                  void setConsent(profile.pushConsent, value);
                }}
              />
            }
          />
          <ListRow
            title="Notification history"
            subtitle="Every alert we sent you"
            leading={
              <IconTile tone="muted">
                <Icon as={Bell} className="size-[18px] text-muted-foreground" />
              </IconTile>
            }
            chevron
            onPress={() => router.push("/notifications")}
          />
        </ListSection>

        <ListSection
          title="Privacy and security"
          footer="Unlock with your fingerprint when you open a result."
        >
          <ListRow
            first
            title="Encrypted in transit"
            subtitle="Messages are stored with your case file."
            leading={
              <IconTile tone="muted">
                <Icon as={Lock} className="size-[18px] text-muted-foreground" />
              </IconTile>
            }
          />
          <ListRow
            title="Biometric unlock"
            subtitle="Required before a result opens."
            leading={
              <IconTile tone="muted">
                <Icon
                  as={ShieldCheck}
                  className="size-[18px] text-muted-foreground"
                />
              </IconTile>
            }
          />
        </ListSection>

        <ListSection title="Session">
          <ListRow
            first
            title="Sign out"
            tone="danger"
            leading={
              <IconTile tone="urgent">
                <Icon as={LogOut} className="size-[18px] text-urgent" />
              </IconTile>
            }
            onPress={() => {
              void signOut();
            }}
          />
        </ListSection>

        <Text className="px-5 text-center text-[12px] text-muted-foreground">
          Hermes Care · built with your clinic
        </Text>
      </ScrollView>
    </TabScreen>
  );
};

export default Profile;
