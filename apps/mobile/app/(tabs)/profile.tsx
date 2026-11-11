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
import { usePatientProfile, useUpdateConsent } from "@/lib/api/queries";
import { signOutPatient } from "@/lib/auth";
import {
  getThemePreference,
  setThemePreference,
  type ThemePreference,
} from "@/lib/theme-preference";

const Profile = () => {
  const router = useRouter();
  const profile = usePatientProfile();
  const updateConsent = useUpdateConsent();
  const [themePreference, setThemeChoice] =
    React.useState<ThemePreference>("system");

  React.useEffect(() => {
    void getThemePreference().then(setThemeChoice);
  }, []);

  const current = profile.data ?? null;

  const chooseTheme = (preference: ThemePreference): void => {
    setThemeChoice(preference);
    void setThemePreference(preference);
  };

  const savePreferences = (input: {
    pushConsent: boolean;
    smsConsent: boolean;
    emailConsent: boolean;
    notificationChannel: "email" | "in_app" | "both";
  }): void => {
    updateConsent.mutate(input);
  };

  const signOut = async (): Promise<void> => {
    await signOutPatient();
    router.replace("/sign-in");
  };

  const error =
    updateConsent.error !== null
      ? updateConsent.error.message
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
          disabled={current === null || updateConsent.isPending}
          onChange={(pushConsent, smsConsent) =>
            savePreferences({
              pushConsent,
              smsConsent,
              emailConsent: current?.emailConsent ?? false,
              notificationChannel: current?.notificationChannel ?? "in_app",
            })
          }
          onChangeChannel={(notificationChannel) =>
            savePreferences({
              pushConsent: current?.pushConsent ?? true,
              smsConsent: current?.smsConsent ?? false,
              emailConsent: notificationChannel !== "in_app",
              notificationChannel,
            })
          }
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
