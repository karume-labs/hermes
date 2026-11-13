import type { NotificationPreference } from "@hermes/types";
import { Pressable, TextInput, useColorScheme, View } from "react-native";
import { SignInConsentRow } from "@/components/auth/sign-in-consent-row";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { placeholderColor } from "@/lib/theme";

const CHANNELS: Array<{ value: NotificationPreference; label: string }> = [
  { value: "in_app", label: "In app" },
  { value: "email", label: "Email" },
  { value: "both", label: "Both" },
];

interface SignInSignUpStepProps {
  name: string;
  setName: (value: string) => void;
  phone: string;
  setPhone: (value: string) => void;
  email: string;
  setEmail: (value: string) => void;
  channel: NotificationPreference;
  setChannel: (value: NotificationPreference) => void;
  consent: boolean;
  toggleConsent: () => void;
  busy: boolean;
  canSignUp: boolean;
  signUp: () => void;
  chooseAnotherNumber: () => void;
}

export const SignInSignUpStep = ({
  name,
  setName,
  phone,
  setPhone,
  email,
  setEmail,
  channel,
  setChannel,
  consent,
  toggleConsent,
  busy,
  canSignUp,
  signUp,
  chooseAnotherNumber,
}: SignInSignUpStepProps) => {
  const scheme = useColorScheme();

  return (
    <View className="gap-4">
      <View className="gap-2">
        <Text className="text-sm font-medium">Your name</Text>
        <TextInput
          className="rounded-xl border border-border bg-card px-4 py-3 text-base text-foreground"
          value={name}
          onChangeText={setName}
          placeholder="As your clinic knows you"
          autoComplete="name"
          placeholderTextColor={placeholderColor(scheme)}
        />
      </View>
      <View className="gap-2">
        <Text className="text-sm font-medium">Phone number</Text>
        <TextInput
          className="rounded-xl border border-border bg-card px-4 py-3 text-base text-foreground"
          value={phone}
          onChangeText={setPhone}
          placeholder="+254712345678"
          keyboardType="phone-pad"
          autoComplete="tel"
          placeholderTextColor={placeholderColor(scheme)}
        />
      </View>
      <View className="gap-2">
        <Text className="text-sm font-medium">Email (optional)</Text>
        <TextInput
          className="rounded-xl border border-border bg-card px-4 py-3 text-base text-foreground"
          value={email}
          onChangeText={setEmail}
          placeholder="you@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          placeholderTextColor={placeholderColor(scheme)}
        />
      </View>

      <View className="gap-2">
        <Text className="text-sm font-medium">Send my updates by</Text>
        <View className="flex-row gap-2">
          {CHANNELS.map((option) => (
            <Pressable
              key={option.value}
              accessibilityRole="button"
              accessibilityState={{ selected: channel === option.value }}
              onPress={() => setChannel(option.value)}
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
      </View>

      <SignInConsentRow consent={consent} onToggle={toggleConsent} />

      <Button size="lg" onPress={signUp} disabled={!canSignUp}>
        <Text>{busy ? "Creating…" : "Create my account"}</Text>
      </Button>
      <Button variant="ghost" onPress={chooseAnotherNumber}>
        <Text>I already have an account</Text>
      </Button>
    </View>
  );
};
