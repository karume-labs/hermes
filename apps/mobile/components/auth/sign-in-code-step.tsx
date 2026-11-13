import { TextInput, useColorScheme, View } from "react-native";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { placeholderColor } from "@/lib/theme";

interface SignInCodeStepProps {
  code: string;
  setCode: (value: string) => void;
  devCode: string | null;
  busy: boolean;
  canVerify: boolean;
  verify: () => void;
  chooseAnotherNumber: () => void;
}

export const SignInCodeStep = ({
  code,
  setCode,
  devCode,
  busy,
  canVerify,
  verify,
  chooseAnotherNumber,
}: SignInCodeStepProps) => {
  const scheme = useColorScheme();

  return (
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
  );
};
