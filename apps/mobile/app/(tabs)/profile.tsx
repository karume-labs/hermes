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
import { usePatientProfile } from "@/lib/api/queries";
import { signOutPatient } from "@/lib/auth";
import {
  getThemePreference,
  setThemePreference,
  type ThemePreference,
} from "@/lib/theme-preference";
import { usePushConsent } from "@/lib/use-push-consent";

const Profile = () => {
  const router = useRouter();
  const profile = usePatientProfile();
  const [themePreference, setThemeChoice] =
    React.useState<ThemePreference>("system");

  React.useEffect(() => {
    void getThemePreference().then(setThemeChoice);
  }, []);

  const current = profile.data ?? null;
  const push = usePushConsent(current);

  const chooseTheme = (preference: ThemePreference): void => {
    setThemeChoice(preference);
    void setThemePreference(preference);
  };

  const signOut = async (): Promise<void> => {
    await signOutPatient();
    router.replace("/sign-in");
  };

  const error =
    push.error !== null
      ? push.error.message
      : profile.error !== null
        ? profile.error.message
        : "";

  return (
    <TabScreen>
      <ScrollView
        className="flex-1 bg-background"
        contentContainerClassName="gap-6 pb-12"
      >
        <ProfileHeader
          name={current === null ? null : current.name}
          clinicName={current?.clinicName ?? ""}
          phone={current?.phone ?? ""}
        />

        {error === "" ? null : (
          <Text className="px-5 text-[13px] text-destructive">{error}</Text>
        )}

        {push.notice === "" ? null : (
          <Text className="px-5 text-[13px] text-destructive">
            {push.notice}
          </Text>
        )}

        <ListSection title="Account">
          <ListRow
            first
            title="Patient ID"
            value={current === null ? "—" : current.id}
          />
          <ListRow title="Phone" value={current?.phone ?? "—"} />
          <ListRow title="Email" value={current?.email ?? "Not added yet"} />
          <ListRow
            title="Clinic"
            value={current?.clinicName ?? "Waiting for your clinic to link you"}
          />
        </ListSection>

        <AppearanceSection
          preference={themePreference}
          onChoose={chooseTheme}
        />

        <NotificationSection
          pushConsent={current?.pushConsent ?? false}
          smsConsent={current?.smsConsent ?? false}
          emailConsent={current?.emailConsent ?? false}
          channel={current?.notificationChannel ?? "in_app"}
          email={current?.email ?? null}
          disabled={current === null || push.pending}
          onChange={(pushConsent, smsConsent) => {
            void push.setPush(pushConsent, smsConsent);
          }}
          onChangeChannel={push.setChannel}
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
