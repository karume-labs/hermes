import { Check } from "lucide-react-native";
import { Pressable, View } from "react-native";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";

interface SignInConsentRowProps {
  consent: boolean;
  onToggle: () => void;
}

export const SignInConsentRow = ({
  consent,
  onToggle,
}: SignInConsentRowProps) => (
  <Pressable
    className="flex-row items-start gap-3"
    onPress={onToggle}
    accessibilityRole="checkbox"
    accessibilityState={{ checked: consent }}
  >
    <View
      className={`mt-0.5 size-5 items-center justify-center rounded border ${
        consent ? "border-primary bg-primary" : "border-border"
      }`}
    >
      {consent ? (
        <Icon as={Check} className="size-3 text-primary-foreground" />
      ) : null}
    </View>
    <Text className="flex-1 text-sm text-muted-foreground">
      I agree to receive my screening results and appointment reminders. I can
      turn this off later in the app.
    </Text>
  </Pressable>
);
