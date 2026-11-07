import { Bell } from "lucide-react-native";
import type * as React from "react";
import { Switch } from "react-native";
import { Icon } from "@/components/ui/icon";
import { IconTile, ListRow, ListSection } from "@/components/ui/list";

interface NotificationSectionProps {
  pushConsent: boolean;
  smsConsent: boolean;
  disabled: boolean;
  onChange: (pushConsent: boolean, smsConsent: boolean) => void;
  onOpenHistory: () => void;
}

export const NotificationSection = ({
  pushConsent,
  smsConsent,
  disabled,
  onChange,
  onOpenHistory,
}: NotificationSectionProps): React.ReactNode => (
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
          value={pushConsent}
          disabled={disabled}
          onValueChange={(value) => onChange(value, smsConsent)}
        />
      }
    />
    <ListRow
      title="SMS fallback"
      subtitle="Text alerts when push cannot reach you."
      trailing={
        <Switch
          value={smsConsent}
          disabled={disabled}
          onValueChange={(value) => onChange(pushConsent, value)}
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
      onPress={onOpenHistory}
    />
  </ListSection>
);
