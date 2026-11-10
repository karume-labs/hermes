import { Fingerprint, Lock, LogOut } from "lucide-react-native";
import * as React from "react";
import { Switch } from "react-native";
import { Icon } from "@/components/ui/icon";
import { IconTile, ListRow, ListSection } from "@/components/ui/list";
import {
  isBiometricAvailable,
  isBiometricUnlockEnabled,
  setBiometricUnlockEnabled,
} from "@/lib/biometrics";

type UnlockState = {
  available: boolean;
  enabled: boolean;
};

const describe = ({ available, enabled }: UnlockState): string => {
  if (!available) {
    return "Add a fingerprint or Face ID in your phone's settings to use this.";
  }
  if (enabled) return "Asked every time you open a result.";
  return "Off. Results open as soon as you sign in.";
};

export const SecuritySections = ({
  onSignOut,
}: {
  onSignOut: () => void;
}): React.ReactNode => {
  const [unlock, setUnlock] = React.useState<UnlockState>({
    available: true,
    enabled: false,
  });
  const [ready, setReady] = React.useState(false);

  React.useEffect(() => {
    void (async () => {
      const [available, enabled] = await Promise.all([
        isBiometricAvailable().catch(() => false),
        isBiometricUnlockEnabled().catch(() => false),
      ]);
      setUnlock({ available, enabled });
      setReady(true);
    })();
  }, []);

  const toggle = (enabled: boolean): void => {
    setUnlock((current) => ({ ...current, enabled }));
    void setBiometricUnlockEnabled(enabled);
  };

  return (
    <>
      <ListSection
        title="Privacy and security"
        footer="Unlock is off by default. Turn it on if other people use this phone."
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
          title="Unlock with fingerprint or Face ID"
          subtitle={describe(unlock)}
          disabled={!ready || !unlock.available}
          leading={
            <IconTile tone="muted">
              <Icon
                as={Fingerprint}
                className="size-[18px] text-muted-foreground"
              />
            </IconTile>
          }
          trailing={
            <Switch
              accessibilityLabel="Unlock results with biometrics"
              value={unlock.enabled}
              disabled={!ready || !unlock.available}
              onValueChange={toggle}
            />
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
          onPress={onSignOut}
        />
      </ListSection>
    </>
  );
};
