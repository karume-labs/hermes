import type { CaseMessage } from "@hermes/types";
import { ChevronLeft, Send } from "lucide-react-native";
import type * as React from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Pressable,
  ScrollView,
  TextInput,
  View,
} from "react-native";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { formatDateTime } from "@/lib/case-format";

interface MessageThreadProps {
  messages: CaseMessage[];
  draft: string;
  error: string;
  loading: boolean;
  sending: boolean;
  onChangeDraft: (value: string) => void;
  onSend: () => void;
  onBack: () => void;
}

export const MessageThread = ({
  messages,
  draft,
  error,
  loading,
  sending,
  onChangeDraft,
  onSend,
  onBack,
}: MessageThreadProps): React.ReactNode => (
  <KeyboardAvoidingView className="flex-1" behavior="padding">
    <View className="flex-row items-center gap-1 border-b border-border/70 px-2 pb-2.5 pt-1">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Back to conversations"
        hitSlop={8}
        className="size-10 items-center justify-center rounded-full active:bg-secondary/60"
        onPress={onBack}
      >
        <Icon as={ChevronLeft} className="size-6 text-foreground" />
      </Pressable>
      <View className="flex-1 gap-0.5">
        <Text className="text-[16px] font-semibold">Care team</Text>
        <Text className="text-[12px] text-muted-foreground">
          Encrypted · replies within a day
        </Text>
      </View>
    </View>

    <ScrollView contentContainerClassName="gap-2.5 px-4 py-4">
      <Text className="pb-1 text-center text-[12px] leading-[17px] text-muted-foreground">
        Messages are stored with your case file. For emergencies call your local
        emergency number.
      </Text>
      {loading ? <ActivityIndicator /> : null}
      {!loading && messages.length === 0 ? (
        <Text className="py-4 text-center text-[14px] text-muted-foreground">
          No messages yet. Ask your care team anything about your result.
        </Text>
      ) : null}
      {messages.map((message) => {
        const mine = message.sender === "patient";
        return (
          <View
            key={message.id}
            className={
              mine
                ? "max-w-[82%] gap-1 self-end rounded-[18px] rounded-br-[6px] bg-primary px-3.5 py-2.5"
                : "max-w-[82%] gap-1 self-start rounded-[18px] rounded-bl-[6px] border border-border/80 bg-card px-3.5 py-2.5"
            }
          >
            <Text
              className={
                mine
                  ? "text-[15px] leading-[21px] text-primary-foreground"
                  : "text-[15px] leading-[21px] text-card-foreground"
              }
            >
              {message.body}
            </Text>
            <Text
              className={
                mine
                  ? "text-[11px] text-primary-foreground/70"
                  : "text-[11px] text-muted-foreground"
              }
            >
              {mine ? "You" : "Care team"} · {formatDateTime(message.createdAt)}
            </Text>
          </View>
        );
      })}
      {error === "" ? null : (
        <Text className="text-[13px] text-destructive">{error}</Text>
      )}
    </ScrollView>

    <View className="flex-row items-end gap-2 border-t border-border/70 bg-card px-3 py-2.5">
      <TextInput
        className="max-h-28 flex-1 rounded-[20px] bg-secondary px-4 py-2.5 text-[15px] text-foreground"
        placeholder="Message your care team"
        placeholderTextColor="#94a3b8"
        value={draft}
        onChangeText={onChangeDraft}
        multiline
      />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Send message"
        className="size-10 items-center justify-center rounded-full bg-primary active:opacity-80 disabled:opacity-40"
        disabled={sending || draft.trim() === ""}
        onPress={onSend}
      >
        <Icon as={Send} className="size-[18px] text-primary-foreground" />
      </Pressable>
    </View>
  </KeyboardAvoidingView>
);
