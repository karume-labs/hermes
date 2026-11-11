import type * as React from "react";
import { View } from "react-native";
import { Icon } from "@/components/ui/icon";
import { IconTile, ListRow, ListSection } from "@/components/ui/list";
import type { PatientNotification } from "@/lib/api/types";
import {
  KIND_ICON,
  KIND_LABEL,
  type NotificationGroup,
  timeLabel,
} from "@/lib/notification-groups";

export const NotificationGroupList = ({
  groups,
  onOpen,
}: {
  groups: NotificationGroup[];
  onOpen: (item: PatientNotification) => void;
}): React.ReactNode => (
  <>
    {groups.map((group) => (
      <ListSection key={group.label} title={group.label}>
        {group.items.map((item, index) => {
          const unread = item.readAt === null;
          return (
            <ListRow
              key={item.id}
              first={index === 0}
              leading={
                <IconTile tone={unread ? "spark" : "muted"}>
                  <Icon
                    as={KIND_ICON[item.kind]}
                    className={
                      unread
                        ? "size-[18px] text-primary"
                        : "size-[18px] text-muted-foreground"
                    }
                  />
                </IconTile>
              }
              title={KIND_LABEL[item.kind]}
              subtitle={`${timeLabel(item.createdAt)} · ${
                item.status === "failed" ? "Not delivered" : "Delivered"
              }`}
              trailing={
                unread ? (
                  <View className="size-2 rounded-full bg-primary" />
                ) : undefined
              }
              chevron={item.caseId !== ""}
              onPress={() => onOpen(item)}
            />
          );
        })}
      </ListSection>
    ))}
  </>
);
