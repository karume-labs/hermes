import type { CareCase } from "@hermes/types";
import { useRouter } from "expo-router";
import {
  HeartHandshake,
  MessageSquare,
  Stethoscope,
  Video,
} from "lucide-react-native";
import { Icon } from "@/components/ui/icon";
import { IconTile, ListRow, ListSection } from "@/components/ui/list";

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
