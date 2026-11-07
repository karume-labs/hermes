import type { PatientCase } from "@hermes/types";
import { MessageSquare } from "lucide-react-native";
import type * as React from "react";
import { ActivityIndicator, ScrollView, View } from "react-native";
import { Icon } from "@/components/ui/icon";
import { IconTile, ListRow, ListSection } from "@/components/ui/list";
import { ScreenHeader } from "@/components/ui/screen-header";
import { Text } from "@/components/ui/text";
import { formatDateTime } from "@/lib/case-format";

interface ConversationListProps {
  cases: PatientCase[];
  loading: boolean;
  error: string;
  onOpen: (caseId: string) => void;
}

export const ConversationList = ({
  cases,
  loading,
  error,
  onOpen,
}: ConversationListProps): React.ReactNode => (
  <ScrollView
    className="flex-1 bg-background"
    contentContainerClassName="gap-5 pb-12"
  >
    <ScreenHeader
      eyebrow="Secure messages"
      title="Your conversations"
      subtitle="Messages are grouped by screening result and shared with your care team."
    />
    {loading ? (
      <View className="items-center gap-2 py-16">
        <ActivityIndicator />
        <Text className="text-[13px] text-muted-foreground">
          Loading conversations…
        </Text>
      </View>
    ) : null}
    {error === "" ? null : (
      <Text className="px-5 text-[13px] text-destructive">{error}</Text>
    )}
    {loading || error !== "" ? null : cases.length === 0 ? (
      <View className="mx-4 items-center gap-2 rounded-[18px] border border-dashed border-border px-6 py-10">
        <IconTile tone="muted">
          <Icon
            as={MessageSquare}
            className="size-[18px] text-muted-foreground"
          />
        </IconTile>
        <Text className="text-[16px] font-semibold">No conversations yet</Text>
        <Text className="text-center text-[13px] leading-[19px] text-muted-foreground">
          When your care team sends an update, the conversation appears here.
        </Text>
      </View>
    ) : (
      <ListSection title="Conversations">
        {cases.map((item, index) => (
          <ListRow
            key={item.careCase.id}
            first={index === 0}
            leading={
              <IconTile tone={item.unreadMessages > 0 ? "spark" : "muted"}>
                <Icon
                  as={MessageSquare}
                  className={
                    item.unreadMessages > 0
                      ? "size-[18px] text-primary"
                      : "size-[18px] text-muted-foreground"
                  }
                />
              </IconTile>
            }
            title={item.careCase.summaryPlainLanguage}
            subtitle={formatDateTime(item.careCase.updatedAt)}
            trailing={
              item.unreadMessages > 0 ? (
                <View className="min-w-[22px] items-center rounded-full bg-primary px-1.5 py-0.5">
                  <Text className="text-[11px] font-bold text-primary-foreground">
                    {item.unreadMessages}
                  </Text>
                </View>
              ) : undefined
            }
            chevron
            onPress={() => onOpen(item.careCase.id)}
          />
        ))}
      </ListSection>
    )}
  </ScrollView>
);
