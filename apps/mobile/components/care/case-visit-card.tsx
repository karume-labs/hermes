import type { Booking, Slot } from "@hermes/types";
import { CalendarDays, Video } from "lucide-react-native";
import { View } from "react-native";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { IconTile } from "@/components/ui/list";
import { Text } from "@/components/ui/text";
import { formatDateTime } from "@/lib/case-format";

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
