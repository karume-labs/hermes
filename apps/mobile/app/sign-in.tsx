import { useRouter } from "expo-router";
import { Check, Phone, ShieldCheck } from "lucide-react-native";
import * as React from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  TextInput,
  View,
} from "react-native";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import {
  type PatientProfile,
  requestPatientCode,
  updateConsent,
  verifyPatientCode,
} from "@/lib/auth";
import { careApi } from "@/lib/care-api";
import { registerPushToken } from "@/lib/notifications";

type Step = "phone" | "code";

const SignInScreen = () => {
  const router = useRouter();
  const [step, setStep] = React.useState<Step>("phone");
  const [phone, setPhone] = React.useState("");
  const [code, setCode] = React.useState("");
  const [consent, setConsent] = React.useState(false);
  const [devCode, setDevCode] = React.useState<string | null>(null);
  const [error, setError] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  const sendCode = async (): Promise<void> => {
    setBusy(true);
    setError("");
    try {
      const result = await requestPatientCode(phone.trim());
      setDevCode(result.devCode === undefined ? null : result.devCode);
      setStep("code");
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Could not send a code.",
      );
    } finally {
      setBusy(false);
    }
  };

  const finish = async (patient: PatientProfile): Promise<void> => {
    const token = await registerPushToken().catch(() => null);
    if (token !== null) {
      await careApi
        .registerDevice(patient.id, token, Platform.OS)
        .catch(() => undefined);
    }
    router.replace("/");
  };

  const verify = async (): Promise<void> => {
    setBusy(true);
    setError("");
    try {
      const patient = await verifyPatientCode(phone.trim(), code.trim());
      // The checkbox is required before a code is sent, so this records the
      // patient's explicit choice rather than relying on seeded defaults.
      await updateConsent(true, true);
      await finish(patient);
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "That code did not work.",
      );
      setBusy(false);
    }
  };

  const canSend = phone.trim().length >= 8 && consent && !busy;
  const canVerify = code.trim().length === 6 && !busy;

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerClassName="gap-5 p-6 pt-16"
      keyboardShouldPersistTaps="handled"
    >
      <View className="items-center gap-3">
        <View className="size-16 items-center justify-center rounded-full bg-primary/10">
          <Icon as={ShieldCheck} className="size-8 text-primary" />
        </View>
        <Text variant="h2" className="text-center text-[28px]">
          Sign in to your results
        </Text>
        <Text className="text-center text-muted-foreground">
          We send a one-time code to the phone number your clinic has on file.
          No password to remember.
        </Text>
      </View>

      {error === "" ? null : (
        <View className="gap-1 rounded-xl border border-destructive/40 bg-destructive/5 p-3">
          <Text className="text-sm text-destructive">{error}</Text>
        </View>
      )}

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
            onPress={() => setConsent((value) => !value)}
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
          <Button
            variant="ghost"
            onPress={() => {
              setStep("phone");
              setCode("");
              setError("");
            }}
          >
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
