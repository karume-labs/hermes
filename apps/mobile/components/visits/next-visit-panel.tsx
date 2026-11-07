import type { PatientBooking } from "@hermes/types";
import { useRouter } from "expo-router";
import { CalendarClock, Stethoscope, XCircle } from "lucide-react-native";
import type * as React from "react";
import { View } from "react-native";
import { NextVisitCard } from "@/components/care/next-visit-card";
import { Icon } from "@/components/ui/icon";
import { IconTile, ListRow, ListSection } from "@/components/ui/list";
import { Text } from "@/components/ui/text";
import { formatDateTime } from "@/lib/case-format";

export const NextVisitPanel = ({
  next,
  later,
  cancelling,
  onCancel,
}: {
  next: PatientBooking;
  later: PatientBooking[];
  cancelling: string | null;
  onCancel: (item: PatientBooking) => void;
}): React.ReactNode => {
  const router = useRouter();
  const openCarePlan = (caseId: string): void => {
    router.push({ pathname: "/care-action", params: { caseId } });
  };

  return (
    <View className="gap-5">
      <NextVisitCard item={next} />

      <ListSection
        title="Before you go"
        footer="A reminder arrives 24 hours before your visit."
      >
        <View className="bg-card px-4 py-3.5">
          <Text className="text-[14px] leading-[21px]">
            {next.booking.prepInstructions}
          </Text>
        </View>
      </ListSection>

      <ListSection title="Visit actions">
        <ListRow
          first
          title="Open care plan"
          subtitle="What this visit covers"
          leading={
            <IconTile tone="info">
              <Icon
                as={Stethoscope}
                className="size-[18px] text-accent-foreground"
              />
            </IconTile>
          }
          chevron
          onPress={() => openCarePlan(next.booking.caseId)}
        />
        <ListRow
          title="Reschedule"
          subtitle="Choose another open slot"
          leading={
            <IconTile tone="muted">
              <Icon
                as={CalendarClock}
                className="size-[18px] text-muted-foreground"
              />
            </IconTile>
          }
          chevron
          onPress={() =>
            router.push({
              pathname: "/booking",
              params: {
                caseId: next.booking.caseId,
                bookingId: next.booking.id,
                clinicId: next.slot.clinicId,
                kind: next.slot.kind,
              },
            })
          }
        />
        <ListRow
          title={
            cancelling === next.booking.id ? "Cancelling…" : "Cancel visit"
          }
          subtitle="Frees the slot for another patient"
          tone="danger"
          disabled={cancelling !== null}
          leading={
            <IconTile tone="urgent">
              <Icon as={XCircle} className="size-[18px] text-urgent" />
            </IconTile>
          }
          onPress={() => onCancel(next)}
        />
      </ListSection>

      {later.length === 0 ? null : (
        <ListSection title="Also booked">
          {later.map((item, index) => (
            <ListRow
              key={item.booking.id}
              first={index === 0}
              title={formatDateTime(item.slot.startAt)}
              subtitle={`${item.clinicName} · ${
                item.slot.kind === "telehealth" ? "Video" : "In person"
              }`}
              chevron
              onPress={() => openCarePlan(item.booking.caseId)}
            />
          ))}
        </ListSection>
      )}
    </View>
  );
};
