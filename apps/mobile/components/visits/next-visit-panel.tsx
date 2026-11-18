import type { PatientBooking } from "@hermes/types";
import { useRouter } from "expo-router";
import {
  CalendarCheck,
  CalendarClock,
  CalendarDays,
  Stethoscope,
  XCircle,
} from "lucide-react-native";
import type * as React from "react";
import { View } from "react-native";
import { NextVisitCard } from "@/components/care/next-visit-card";
import { Icon } from "@/components/ui/icon";
import { IconTile, ListRow, ListSection } from "@/components/ui/list";
import { VisitPrepCard } from "@/components/visits/visit-prep-card";
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

      <VisitPrepCard instructions={next.booking.prepInstructions} />

      <ListSection
        title="Visit actions"
        icon={
          <Icon
            as={CalendarCheck}
            className="size-[13px] text-muted-foreground"
          />
        }
      >
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
        <ListSection
          title="Also booked"
          icon={
            <Icon
              as={CalendarDays}
              className="size-[13px] text-muted-foreground"
            />
          }
        >
          {later.map((item, index) => (
            <ListRow
              key={item.booking.id}
              first={index === 0}
              leading={
                <IconTile
                  tone={item.slot.kind === "telehealth" ? "info" : "muted"}
                >
                  <Icon
                    as={
                      item.slot.kind === "telehealth"
                        ? Stethoscope
                        : CalendarDays
                    }
                    className={
                      item.slot.kind === "telehealth"
                        ? "size-[18px] text-accent-foreground"
                        : "size-[18px] text-muted-foreground"
                    }
                  />
                </IconTile>
              }
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
