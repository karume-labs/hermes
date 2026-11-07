import type { Booking, CareCase, CaseFeedback, Slot } from "@hermes/types";
import { useRouter } from "expo-router";
import {
  CalendarDays,
  CheckCircle2,
  HeartHandshake,
  MessageSquare,
  Stethoscope,
  Video,
} from "lucide-react-native";
import { useState } from "react";
import { Pressable, View } from "react-native";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { IconTile, ListRow, ListSection } from "@/components/ui/list";
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

interface VisitCardProps {
  appointment: Booking;
  slot: Slot;
  calendarNote: string;
  onSyncCalendar: () => void;
}

export const VisitCard = ({
  appointment,
  slot,
  calendarNote,
  onSyncCalendar,
}: VisitCardProps) => (
  <View className="mx-4 gap-3 rounded-[16px] bg-secondary/40 p-4">
    <View className="flex-row items-center gap-3">
      <IconTile tone="info">
        <Icon
          as={slot.kind === "telehealth" ? Video : CalendarDays}
          className="size-[18px] text-accent-foreground"
        />
      </IconTile>
      <View className="flex-1 gap-0.5">
        <Text className="text-[15px] font-semibold">
          {formatDateTime(slot.startAt)}
        </Text>
        <Text className="text-[12px] leading-[17px] text-muted-foreground">
          {slot.kind === "telehealth" ? "Video visit" : "In person"} ·{" "}
          {appointment.prepInstructions}
        </Text>
      </View>
    </View>
    <Button
      variant="outline"
      size="sm"
      className="self-start"
      onPress={onSyncCalendar}
    >
      <Icon as={CalendarDays} className="size-4" />
      <Text>Add to calendar</Text>
    </Button>
    {calendarNote === "" ? null : (
      <Text className="text-[12px] text-muted-foreground">{calendarNote}</Text>
    )}
  </View>
);

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

export const NextSteps = ({ careCase }: { careCase: CareCase }) => {
  const router = useRouter();
  const bookingClinicId =
    careCase.referralClinicId === null
      ? careCase.clinicId
      : careCase.referralClinicId;
  if (careCase.status === "closed") return null;
  return (
    <ListSection title="Next steps">
      <ListRow
        first
        title="Book an in-person visit"
        subtitle="Confirmatory check at your clinic"
        leading={
          <IconTile tone="spark">
            <Icon as={Stethoscope} className="size-[18px] text-primary" />
          </IconTile>
        }
        chevron
        onPress={() =>
          router.push({
            pathname: "/booking",
            params: {
              caseId: careCase.id,
              clinicId: bookingClinicId,
              kind: "in_person",
            },
          })
        }
      />
      <ListRow
        title="Request a video review"
        subtitle="Talk to a clinician from home"
        leading={
          <IconTile tone="info">
            <Icon as={Video} className="size-[18px] text-accent-foreground" />
          </IconTile>
        }
        chevron
        onPress={() =>
          router.push({
            pathname: "/booking",
            params: {
              caseId: careCase.id,
              clinicId: bookingClinicId,
              kind: "telehealth",
            },
          })
        }
      />
      <ListRow
        title="Message your care team"
        subtitle="Secure, attached to this result"
        leading={
          <IconTile tone="muted">
            <Icon
              as={MessageSquare}
              className="size-[18px] text-muted-foreground"
            />
          </IconTile>
        }
        chevron
        onPress={() =>
          router.push({
            pathname: "/messages",
            params: { caseId: careCase.id },
          })
        }
      />
      <ListRow
        title="Track your care journey"
        subtitle="See every step so far"
        leading={
          <IconTile tone="muted">
            <Icon
              as={HeartHandshake}
              className="size-[18px] text-muted-foreground"
            />
          </IconTile>
        }
        chevron
        onPress={() =>
          router.push({
            pathname: "/journey",
            params: { caseId: careCase.id },
          })
        }
      />
    </ListSection>
  );
};

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
