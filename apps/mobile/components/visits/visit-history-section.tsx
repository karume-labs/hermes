import type { PatientBooking } from "@hermes/types";
import { useRouter } from "expo-router";
import { Clock } from "lucide-react-native";
import type * as React from "react";
import { Icon } from "@/components/ui/icon";
import { IconTile, ListRow, ListSection } from "@/components/ui/list";
import { formatDateTime } from "@/lib/case-format";
import { statusLabel } from "@/lib/visit-status";

export const VisitHistorySection = ({
  past,
}: {
  past: PatientBooking[];
}): React.ReactNode => {
  const router = useRouter();
  if (past.length === 0) return null;

  return (
    <ListSection title="Visit history">
      {past.map((item, index) => (
        <ListRow
          key={item.booking.id}
          first={index === 0}
          leading={
            <IconTile tone="muted">
              <Icon as={Clock} className="size-[18px] text-muted-foreground" />
            </IconTile>
          }
          title={formatDateTime(item.slot.startAt)}
          subtitle={`${statusLabel(item)} · ${item.clinicName}`}
          chevron
          onPress={() =>
            router.push({
              pathname: "/care-action",
              params: { caseId: item.booking.caseId },
            })
          }
        />
      ))}
    </ListSection>
  );
};
