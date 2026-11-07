import { useRouter } from "expo-router";
import * as React from "react";
import { ScrollView } from "react-native";
import { TabScreen } from "@/components/layout/tab-screen";
import { AppearanceSection } from "@/components/profile/appearance-section";
import { NotificationSection } from "@/components/profile/notification-section";
import { ProfileHeader } from "@/components/profile/profile-header";
import { SecuritySections } from "@/components/profile/security-sections";
import { ListRow, ListSection } from "@/components/ui/list";
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

type ProfileValue = Awaited<ReturnType<typeof loadPatientProfile>>;

const Profile = () => {
  const router = useRouter();
  const [profile, setProfile] = React.useState<ProfileValue | null>(null);
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

  return (
    <TabScreen>
      <ScrollView
        className="flex-1 bg-background"
        contentContainerClassName="gap-6 pb-12"
      >
        <ProfileHeader
          name={profile === null ? null : profile.name}
          clinicName={profile === null ? "" : profile.clinicName}
          phone={profile === null ? "" : profile.phone}
        />

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

        <AppearanceSection
          preference={themePreference}
          onChoose={chooseTheme}
        />

        <NotificationSection
          pushConsent={profile?.pushConsent === true}
          smsConsent={profile?.smsConsent === true}
          disabled={profile === null || saving}
          onChange={(pushConsent, smsConsent) => {
            void setConsent(pushConsent, smsConsent);
          }}
          onOpenHistory={() => router.push("/notifications")}
        />

        <SecuritySections
          onSignOut={() => {
            void signOut();
          }}
        />

        <Text className="px-5 text-center text-[12px] text-muted-foreground">
          Hermes Care · built with your clinic
        </Text>
      </ScrollView>
    </TabScreen>
  );
};

export default Profile;
