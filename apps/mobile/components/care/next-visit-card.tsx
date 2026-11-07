import type { PatientBooking } from "@hermes/types";
import { Video } from "lucide-react-native";
import { View } from "react-native";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";

interface NextVisitCardProps {
  item: PatientBooking;
}

export const NextVisitCard = ({ item }: NextVisitCardProps) => {
  const start = new Date(item.slot.startAt);
  const day = start.toLocaleDateString(undefined, { day: "numeric" });
  const month = start
    .toLocaleDateString(undefined, { month: "short" })
    .toUpperCase();
  const weekday = start.toLocaleDateString(undefined, { weekday: "long" });
  const time = start.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
  const telehealth = item.slot.kind === "telehealth";

  return (
    <View className="mx-4 flex-row items-center gap-4 rounded-[18px] border border-primary/25 bg-card p-4">
      <View className="items-center rounded-[14px] bg-primary/15 px-3.5 py-2">
        <Text className="text-[11px] font-bold tracking-[0.1em] text-primary">
          {month}
        </Text>
        <Text className="text-[26px] font-extrabold leading-[30px] text-primary">
          {day}
        </Text>
      </View>
      <View className="flex-1 gap-0.5">
        <Text className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
          {weekday} · {time}
        </Text>
        <Text className="text-[17px] font-semibold leading-[23px]">
          {telehealth ? "Video visit" : "In-person visit"}
        </Text>
        <View className="flex-row items-center gap-1.5">
          {telehealth ? (
            <Icon as={Video} className="size-3.5 text-muted-foreground" />
          ) : null}
          <Text className="text-[13px] text-muted-foreground">
            {item.clinicName}
          </Text>
        </View>
      </View>
      <View className="rounded-full border border-success/30 bg-success-fill px-2.5 py-1">
        <Text className="text-[11px] font-bold text-success">Confirmed</Text>
      </View>
    </View>
  );
};
