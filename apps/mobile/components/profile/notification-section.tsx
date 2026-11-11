import type { NotificationPreference } from "@hermes/types";
import { Bell } from "lucide-react-native";
import type * as React from "react";
import { Text as NativeText, Pressable, Switch, View } from "react-native";
import { Icon } from "@/components/ui/icon";
import { IconTile, ListRow, ListSection } from "@/components/ui/list";
import { Text } from "@/components/ui/text";

interface NotificationSectionProps {
  pushConsent: boolean;
  smsConsent: boolean;
  emailConsent: boolean;
  channel: NotificationPreference;
  email: string | null;
  disabled: boolean;
  onChange: (pushConsent: boolean, smsConsent: boolean) => void;
  onChangeChannel: (channel: NotificationPreference) => void;
  onOpenHistory: () => void;
}

const CHANNELS: Array<{ value: NotificationPreference; label: string }> = [
  { value: "in_app", label: "In app" },
  { value: "email", label: "Email" },
  { value: "both", label: "Both" },
];

export const NotificationSection = ({
  pushConsent,
  smsConsent,
  emailConsent,
  channel,
  email,
  disabled,
  onChange,
  onChangeChannel,
  onOpenHistory,
}: NotificationSectionProps): React.ReactNode => (
  <ListSection
    title="Notifications"
    footer="Your result never appears in a notification body."
  >
    <View className="gap-2 px-4 py-3">
      <Text className="text-sm font-medium">Send updates by</Text>
      <View className="flex-row gap-2">
        {CHANNELS.map((option) => (
          <Pressable
            key={option.value}
            accessibilityRole="button"
            accessibilityState={{ selected: channel === option.value }}
            disabled={disabled}
            onPress={() => onChangeChannel(option.value)}
            className={
              channel === option.value
                ? "flex-1 items-center rounded-[10px] bg-primary px-3 py-2"
                : "flex-1 items-center rounded-[10px] border border-border bg-card px-3 py-2"
            }
          >
            <Text
              className={
                channel === option.value
                  ? "text-[13px] font-semibold text-primary-foreground"
                  : "text-[13px] font-medium"
              }
            >
              {option.label}
            </Text>
          </Pressable>
        ))}
      </View>
      {channel === "in_app" ? null : (
        <NativeText className="text-[12px] leading-[17px] text-muted-foreground">
          {email === null
            ? "Add an email address with your clinic to receive updates by email."
            : `Updates go to ${email}${emailConsent ? "" : " once you confirm email consent"}.`}
        </NativeText>
      )}
    </View>
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
