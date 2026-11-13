import { Phone } from "lucide-react-native";
import { TextInput, useColorScheme, View } from "react-native";
import { SignInConsentRow } from "@/components/auth/sign-in-consent-row";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { placeholderColor } from "@/lib/theme";

interface SignInPhoneStepProps {
  phone: string;
  setPhone: (value: string) => void;
  consent: boolean;
  toggleConsent: () => void;
  busy: boolean;
  canSend: boolean;
  sendCode: () => void;
  startSignUp: () => void;
}

export const SignInPhoneStep = ({
  phone,
  setPhone,
  consent,
  toggleConsent,
  busy,
  canSend,
  sendCode,
  startSignUp,
}: SignInPhoneStepProps) => {
  const scheme = useColorScheme();

  return (
    <View className="gap-4">
      <View className="gap-2">
        <Text className="text-sm font-medium">Phone number</Text>
        <View className="flex-row items-center gap-2 rounded-xl border border-border bg-card px-3">
          <Icon as={Phone} className="size-4 text-muted-foreground" />
          <TextInput
            className="flex-1 py-3 text-base text-foreground"
            value={phone}
            onChangeText={setPhone}
            placeholder="+254712345678"
            keyboardType="phone-pad"
            autoComplete="tel"
            placeholderTextColor={placeholderColor(scheme)}
          />
        </View>
      </View>

      <SignInConsentRow consent={consent} onToggle={toggleConsent} />

      <Button size="lg" onPress={sendCode} disabled={!canSend}>
        <Text>{busy ? "Sending…" : "Send my code"}</Text>
      </Button>
      <Button variant="ghost" onPress={startSignUp}>
        <Text>New here? Create an account</Text>
      </Button>
    </View>
  );
};
