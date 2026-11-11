import type { NotificationPreference } from "@hermes/types";
import { Check, Phone } from "lucide-react-native";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  TextInput,
  useColorScheme,
  View,
} from "react-native";
import { SignInError, SignInHeader } from "@/components/auth/sign-in-header";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { placeholderColor } from "@/lib/theme";
import { usePatientSignIn } from "@/lib/use-patient-sign-in";

const CHANNELS: Array<{ value: NotificationPreference; label: string }> = [
  { value: "in_app", label: "In app" },
  { value: "email", label: "Email" },
  { value: "both", label: "Both" },
];

const ConsentRow = ({
  consent,
  onToggle,
}: {
  consent: boolean;
  onToggle: () => void;
}) => (
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

const SignInScreen = () => {
  const scheme = useColorScheme();
  const {
    step,
    phone,
    setPhone,
    name,
    setName,
    email,
    setEmail,
    code,
    setCode,
    consent,
    toggleConsent,
    channel,
    setChannel,
    devCode,
    error,
    busy,
    sendCode,
    verify,
    signUp,
    startSignUp,
    chooseAnotherNumber,
    canSend,
    canVerify,
    canSignUp,
  } = usePatientSignIn();

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerClassName="gap-5 p-6 pt-16"
      keyboardShouldPersistTaps="handled"
    >
      <SignInHeader />
      <SignInError error={error} />

      {step === "phone" ? (
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

          <ConsentRow consent={consent} onToggle={toggleConsent} />

          <Button size="lg" onPress={sendCode} disabled={!canSend}>
            <Text>{busy ? "Sending…" : "Send my code"}</Text>
          </Button>
          <Button variant="ghost" onPress={startSignUp}>
            <Text>New here? Create an account</Text>
          </Button>
        </View>
      ) : step === "signup" ? (
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

          <ConsentRow consent={consent} onToggle={toggleConsent} />

          <Button size="lg" onPress={signUp} disabled={!canSignUp}>
            <Text>{busy ? "Creating…" : "Create my account"}</Text>
          </Button>
          <Button variant="ghost" onPress={chooseAnotherNumber}>
            <Text>I already have an account</Text>
          </Button>
        </View>
      ) : (
        <View className="gap-4">
          <View className="gap-2">
            <Text className="text-sm font-medium">6-digit code</Text>
            <TextInput
              className="rounded-xl border border-border bg-card px-4 py-3 text-center text-2xl tracking-[0.4em] text-foreground"
              value={code}
              onChangeText={setCode}
              placeholder="000000"
              keyboardType="number-pad"
              maxLength={6}
              placeholderTextColor={placeholderColor(scheme)}
            />
            {devCode === null ? null : (
              <Text className="text-xs text-muted-foreground">
                Development mode: your code is {devCode}
              </Text>
            )}
          </View>
          <Button size="lg" onPress={verify} disabled={!canVerify}>
            <Text>{busy ? "Checking…" : "Sign in"}</Text>
          </Button>
          <Button variant="ghost" onPress={chooseAnotherNumber}>
            <Text>Use a different number</Text>
          </Button>
        </View>
      )}

      {busy ? <ActivityIndicator /> : null}
      <Text className="text-center text-xs text-muted-foreground">
        Codes expire after 10 minutes. When your clinic sends your first result,
        it appears here automatically.
      </Text>
    </ScrollView>
  );
};

export default SignInScreen;
