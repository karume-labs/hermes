import type { CareCase } from "@hermes/types";
import { CheckCircle2 } from "lucide-react-native";
import { View } from "react-native";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { formatDateTime } from "@/lib/case-format";

interface AckCardProps {
  careCase: CareCase;
  busy: boolean;
  onAcknowledge: () => void;
}

export const AckCard = ({ careCase, busy, onAcknowledge }: AckCardProps) => {
  if (careCase.status === "closed") return null;
  if (careCase.acknowledgedAt !== null) {
    return (
      <View className="mx-4 flex-row items-center gap-2">
        <Icon as={CheckCircle2} className="size-4 text-success" />
        <Text className="text-[13px] text-muted-foreground">
          Seen {formatDateTime(careCase.acknowledgedAt)}
        </Text>
      </View>
    );
  }
  return (
    <View className="mx-4 gap-3 rounded-[16px] bg-secondary/50 p-4">
      <Text className="text-[17px] font-semibold">
        Confirm you have seen this
      </Text>
      <Text className="text-[13px] leading-[19px] text-muted-foreground">
        This tells your care team they can stop the reminder calls.
      </Text>
      <Button onPress={onAcknowledge} disabled={busy} size="lg">
        <Icon as={CheckCircle2} className="text-primary-foreground" />
        <Text>{busy ? "Confirming…" : "I have seen this result"}</Text>
      </Button>
    </View>
  );
};
