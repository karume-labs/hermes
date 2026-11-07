import { Lock, LogOut, ShieldCheck } from "lucide-react-native";
import type * as React from "react";
import { Icon } from "@/components/ui/icon";
import { IconTile, ListRow, ListSection } from "@/components/ui/list";

export const SecuritySections = ({
  onSignOut,
}: {
  onSignOut: () => void;
}): React.ReactNode => (
  <>
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
        onPress={onSignOut}
      />
    </ListSection>
  </>
);
