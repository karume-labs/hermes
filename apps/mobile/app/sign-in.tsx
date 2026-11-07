import { Check, Phone } from "lucide-react-native";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  TextInput,
  View,
} from "react-native";
import { SignInError, SignInHeader } from "@/components/auth/sign-in-header";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { usePatientSignIn } from "@/lib/use-patient-sign-in";

const SignInScreen = () => {
  const {
    step,
    phone,
    setPhone,
    code,
    setCode,
    consent,
    toggleConsent,
    devCode,
    error,
    busy,
    sendCode,
    verify,
    chooseAnotherNumber,
    canSend,
    canVerify,
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
                placeholderTextColor="#94a3b8"
              />
            </View>
          </View>

          <Pressable
            className="flex-row items-start gap-3"
            onPress={toggleConsent}
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
              I agree to receive my screening results and appointment reminders
              by SMS and push notification. I can turn this off later in the
              app.
            </Text>
          </Pressable>

          <Button size="lg" onPress={sendCode} disabled={!canSend}>
            <Text>{busy ? "Sending…" : "Send my code"}</Text>
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
              placeholderTextColor="#94a3b8"
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
        Codes expire after 10 minutes. Contact your clinic if your number has
        changed.
      </Text>
    </ScrollView>
  );
};

export default SignInScreen;
