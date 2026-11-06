import { Fingerprint, Lock, ShieldCheck } from "lucide-react-native";
import * as React from "react";
import { View } from "react-native";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import {
  authenticateWithBiometrics,
  isBiometricAvailable,
} from "@/lib/biometrics";

type LockState = "checking" | "locked" | "unlocked" | "unavailable";

interface BiometricGateProps {
  children: React.ReactNode;
}

export const BiometricGate = ({ children }: BiometricGateProps) => {
  const [state, setState] = React.useState<LockState>("checking");
  const [error, setError] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  const unlock = React.useCallback(async (): Promise<void> => {
    setBusy(true);
    setError("");
    const ok = await authenticateWithBiometrics().catch(() => false);
    setBusy(false);
    if (ok) {
      setState("unlocked");
      return;
    }
    setState("locked");
    setError("Unlock cancelled. Your results stay hidden until you confirm.");
  }, []);

  React.useEffect(() => {
    void (async () => {
      const available = await isBiometricAvailable().catch(() => false);
      if (!available) {
        setState("unavailable");
        return;
      }
      setState("locked");
      await unlock();
    })();
  }, [unlock]);

  if (state === "unlocked") {
    return <>{children}</>;
  }

  return (
    <View className="flex-1 justify-center gap-5 bg-background p-6">
      <View className="items-center gap-3">
        <View className="size-16 items-center justify-center rounded-full bg-muted">
          <Icon
            as={state === "unavailable" ? ShieldCheck : Lock}
            className="size-8 text-foreground"
          />
        </View>
        <Text variant="h3" className="text-center">
          {state === "unavailable"
            ? "Biometric unlock is off"
            : "Your results are locked"}
        </Text>
        <Text className="text-center text-muted-foreground">
          {state === "unavailable"
            ? "This device has no enrolled Face ID or fingerprint. You can continue without device biometrics."
            : "Confirm it is you with Face ID or your fingerprint to review screening updates."}
        </Text>
      </View>
      {state === "checking" ? (
        <Text className="text-center text-muted-foreground">Checking…</Text>
      ) : null}
      {state === "locked" ? (
        <Button onPress={unlock} disabled={busy} size="lg">
          <Icon as={Fingerprint} className="text-primary-foreground" />
          <Text>
            {busy ? "Waiting for biometrics…" : "Unlock with biometrics"}
          </Text>
        </Button>
      ) : null}
      {state === "unavailable" ? (
        <Button onPress={() => setState("unlocked")} size="lg">
          <Text>Continue without biometrics</Text>
        </Button>
      ) : null}
      {error === "" ? null : (
        <Text className="text-center text-sm text-destructive">{error}</Text>
      )}
    </View>
  );
};
