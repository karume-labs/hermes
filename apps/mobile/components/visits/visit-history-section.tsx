import type { PatientBooking } from "@hermes/types";
import { useRouter } from "expo-router";
import { CalendarX2, Check, History, Video } from "lucide-react-native";
import type * as React from "react";
import { View } from "react-native";
import { Icon } from "@/components/ui/icon";
import { IconTile, ListRow, ListSection } from "@/components/ui/list";
import { Text } from "@/components/ui/text";
import { formatDateTime } from "@/lib/case-format";
import { statusLabel } from "@/lib/visit-status";

const TONE: Record<string, "success" | "urgent" | "muted"> = {
  Attended: "success",
  Cancelled: "urgent",
  Missed: "urgent",
};

export const VisitHistorySection = ({
  past,
}: {
  past: PatientBooking[];
}): React.ReactNode => {
  const router = useRouter();
  if (past.length === 0) return null;

  return (
    <ListSection
      title="Visit history"
      icon={<Icon as={History} className="size-[13px] text-muted-foreground" />}
    >
      {past.map((item, index) => {
        const label = statusLabel(item);
        const tone = TONE[label] ?? "muted";
        const Mark = item.slot.kind === "telehealth" ? Video : Check;
        return (
          <ListRow
            key={item.booking.id}
            first={index === 0}
            leading={
              <IconTile tone={tone}>
                <Icon
                  as={tone === "urgent" ? CalendarX2 : Mark}
                  className={
                    tone === "success"
                      ? "size-[18px] text-success"
                      : tone === "urgent"
                        ? "size-[18px] text-urgent"
                        : "size-[18px] text-muted-foreground"
                  }
                />
              </IconTile>
            }
            title={formatDateTime(item.slot.startAt)}
            subtitle={item.clinicName}
            trailing={
              <View className="rounded-full border border-border px-2 py-0.5">
                <Text className="text-[10px] font-bold uppercase tracking-[0.08em] text-muted-foreground">
                  {label}
                </Text>
              </View>
            }
            chevron
            onPress={() =>
              router.push({
                pathname: "/care-action",
                params: { caseId: item.booking.caseId },
              })
            }
          />
        );
      })}
    </ListSection>
  );
};
