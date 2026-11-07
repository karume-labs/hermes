import type { CareCase, CaseFeedback } from "@hermes/types";
import { CheckCircle2 } from "lucide-react-native";
import { useState } from "react";
import { Pressable, View } from "react-native";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { formatDateTime } from "@/lib/case-format";

export const ClosureCard = ({ careCase }: { careCase: CareCase }) => (
  <View className="mx-4 gap-2 rounded-[16px] bg-success/10 p-4">
    <View className="flex-row items-center gap-2">
      <Icon as={CheckCircle2} className="size-[18px] text-success" />
      <Text className="text-[15px] font-semibold text-success">
        Care plan signed off
      </Text>
    </View>
    <Text className="text-[14px] leading-[21px] text-foreground">
      {careCase.closurePlan === null
        ? "Your clinician signed off your care plan."
        : careCase.closurePlan}
    </Text>
    <Text className="text-[12px] leading-[17px] text-muted-foreground">
      Contact your clinic if new symptoms appear.
    </Text>
  </View>
);

interface FeedbackCardProps {
  careCase: CareCase;
  feedback: CaseFeedback | null;
  busy: boolean;
  onSubmit: (understood: boolean, confidence: number) => void;
}

// Teach-back, not a read receipt: the patient tells us whether the result made
// sense and how reassured they feel. It stays editable.
export const FeedbackCard = ({
  careCase,
  feedback,
  busy,
  onSubmit,
}: FeedbackCardProps) => {
  const [understood, setUnderstood] = useState<boolean | null>(
    feedback === null ? null : feedback.understood,
  );
  const [confidence, setConfidence] = useState<number>(
    feedback === null ? 3 : feedback.confidence,
  );
  return (
    <View className="mx-4 gap-3">
      <View className="gap-1">
        <Text className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
          Teach-back
        </Text>
        <Text className="text-[17px] font-semibold">
          Did you understand your result?
        </Text>
        <Text className="text-[13px] leading-[19px] text-muted-foreground">
          This helps your clinic know whether the explanation was clear. It does
          not change your care.
        </Text>
      </View>

      <View className="flex-row gap-2">
        {(
          [
            [true, "Yes, I understand"],
            [false, "No, I need help"],
          ] as const
        ).map(([value, label]) => (
          <Pressable
            key={String(value)}
            accessibilityRole="button"
            onPress={() => setUnderstood(value)}
            className={
              understood === value
                ? "flex-1 items-center rounded-[10px] bg-primary px-3 py-2.5"
                : "flex-1 items-center rounded-[10px] border border-border bg-card px-3 py-2.5"
            }
          >
            <Text
              className={
                understood === value
                  ? "text-[13px] font-semibold text-primary-foreground"
                  : "text-[13px] font-medium"
              }
            >
              {label}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text className="text-[13px] font-medium">
        How reassured do you feel? {confidence}/5
      </Text>
      <View className="flex-row gap-2">
        {[1, 2, 3, 4, 5].map((value) => (
          <Pressable
            key={value}
            accessibilityRole="button"
            accessibilityLabel={`${value} of 5`}
            onPress={() => setConfidence(value)}
            className={
              confidence === value
                ? "size-11 items-center justify-center rounded-full bg-primary"
                : "size-11 items-center justify-center rounded-full border border-border bg-card"
            }
          >
            <Text
              className={
                confidence === value
                  ? "text-[15px] font-bold text-primary-foreground"
                  : "text-[15px] font-medium"
              }
            >
              {value}
            </Text>
          </Pressable>
        ))}
      </View>

      <Button
        size="lg"
        disabled={understood === null || busy || careCase.id === ""}
        onPress={() => {
          if (understood !== null) onSubmit(understood, confidence);
        }}
      >
        <Text>{busy ? "Saving…" : "Send my answer"}</Text>
      </Button>
      {feedback === null ? null : (
        <Text className="text-[12px] text-muted-foreground">
          Last saved {formatDateTime(feedback.createdAt)}.
        </Text>
      )}
    </View>
  );
};
