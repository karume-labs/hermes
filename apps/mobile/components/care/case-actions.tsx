import type { Booking, CareCase, Slot } from "@hermes/types";
import { useRouter } from "expo-router";
import {
  CalendarDays,
  CheckCircle2,
  MessageSquare,
  Stethoscope,
  Video,
} from "lucide-react-native";
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
      <Text className="text-xs text-muted-foreground">
        Seen {formatDateTime(careCase.acknowledgedAt)}
      </Text>
    );
  }
  return (
    <View className="gap-2 rounded-xl border border-border bg-secondary/40 p-4">
      <Text className="font-semibold">Confirm you have seen this</Text>
      <Text className="text-sm text-muted-foreground">
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
  <View className="gap-2 rounded-xl border border-border p-4">
    <Text className="font-semibold">Your visit</Text>
    <Text>{formatDateTime(slot.startAt)}</Text>
    <Text className="text-sm text-muted-foreground">
      {slot.kind === "telehealth" ? "Video visit" : "In person"} ·{" "}
      {appointment.prepInstructions}
    </Text>
    <Button variant="outline" size="sm" onPress={onSyncCalendar}>
      <Icon as={CalendarDays} />
      <Text>Add to device calendar</Text>
    </Button>
    {calendarNote === "" ? null : (
      <Text className="text-xs text-muted-foreground">{calendarNote}</Text>
    )}
  </View>
);

export const ClosureCard = ({ careCase }: { careCase: CareCase }) => (
  <View className="gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
    <Text className="font-semibold text-emerald-900">Case closed</Text>
    <Text className="text-sm text-emerald-900">
      {careCase.closurePlan === null
        ? "Your clinician signed off your care plan."
        : careCase.closurePlan}
    </Text>
    <Text className="text-xs text-emerald-800">
      Keep this plan and contact your clinic if new symptoms appear.
    </Text>
  </View>
);

export const NextSteps = ({ careCase }: { careCase: CareCase }) => {
  const router = useRouter();
  if (careCase.status === "closed") return null;
  return (
    <View className="gap-2">
      <Text className="font-semibold">Next steps</Text>
      <Button
        size="lg"
        onPress={() =>
          router.push({
            pathname: "/booking",
            params: {
              caseId: careCase.id,
              clinicId: careCase.clinicId,
              kind: "in_person",
            },
          })
        }
      >
        <Icon as={Stethoscope} className="text-primary-foreground" />
        <Text>Book an in-person visit</Text>
      </Button>
      <Button
        variant="secondary"
        onPress={() =>
          router.push({
            pathname: "/booking",
            params: {
              caseId: careCase.id,
              clinicId: careCase.clinicId,
              kind: "telehealth",
            },
          })
        }
      >
        <Icon as={Video} />
        <Text>Request a video review</Text>
      </Button>
      <Button
        variant="ghost"
        onPress={() =>
          router.push({
            pathname: "/messages",
            params: { caseId: careCase.id },
          })
        }
      >
        <Icon as={MessageSquare} />
        <Text>Message your care team</Text>
      </Button>
      <Button
        variant="ghost"
        onPress={() =>
          router.push({
            pathname: "/journey",
            params: { caseId: careCase.id },
          })
        }
      >
        <Text>Track your care journey</Text>
      </Button>
    </View>
  );
};
