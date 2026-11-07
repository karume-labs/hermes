import type { CaseMessage, PatientCase } from "@hermes/types";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ChevronLeft, MessageSquare, Send } from "lucide-react-native";
import * as React from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Pressable,
  ScrollView,
  TextInput,
  View,
} from "react-native";
import { TabScreen } from "@/components/layout/tab-screen";
import { Icon } from "@/components/ui/icon";
import { IconTile, ListRow, ListSection } from "@/components/ui/list";
import { ScreenHeader } from "@/components/ui/screen-header";
import { Text } from "@/components/ui/text";
import { careApi } from "@/lib/care-api";
import { formatDateTime } from "@/lib/case-format";
import { paramString } from "@/lib/params";
import { getPatientId, trackEvent } from "@/lib/session";

const Messages = () => {
  const params = useLocalSearchParams<{ caseId?: string }>();
  const caseId = paramString(params.caseId);
  const router = useRouter();
  const [patientId, setPatientId] = React.useState<string | null>(null);
  const [cases, setCases] = React.useState<PatientCase[]>([]);
  const [messages, setMessages] = React.useState<CaseMessage[]>([]);
  const [draft, setDraft] = React.useState("");
  const [error, setError] = React.useState("");
  const [loading, setLoading] = React.useState(true);
  const [sending, setSending] = React.useState(false);

  const load = React.useCallback(
    async (pid: string, cid: string): Promise<void> => {
      try {
        setMessages(await careApi.messages(pid, cid));
        await careApi.markRead(pid, cid);
      } catch (caught) {
        setError(
          caught instanceof Error ? caught.message : "Could not load messages.",
        );
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  React.useEffect(() => {
    void (async () => {
      const pid = await getPatientId();
      setPatientId(pid);
      if (caseId === undefined) {
        setCases(await careApi.patientCases(pid));
        setLoading(false);
        return;
      }
      await load(pid, caseId);
    })();
  }, [caseId, load]);

  const send = async (): Promise<void> => {
    const body = draft.trim();
    if (patientId === null || caseId === undefined || body === "") return;
    setSending(true);
    setError("");
    try {
      await careApi.sendMessage(patientId, caseId, body);
      setDraft("");
      trackEvent(patientId, "message_sent", caseId);
      await load(patientId, caseId);
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Could not send message.",
      );
    } finally {
      setSending(false);
    }
  };

  if (caseId === undefined) {
    return (
      <TabScreen>
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
              <Text className="text-[16px] font-semibold">
                No conversations yet
              </Text>
              <Text className="text-center text-[13px] leading-[19px] text-muted-foreground">
                When your care team sends an update, the conversation appears
                here.
              </Text>
            </View>
          ) : (
            <ListSection title="Conversations">
              {cases.map((item, index) => (
                <ListRow
                  key={item.careCase.id}
                  first={index === 0}
                  leading={
                    <IconTile
                      tone={item.unreadMessages > 0 ? "spark" : "muted"}
                    >
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
                  onPress={() =>
                    router.push({
                      pathname: "/messages",
                      params: { caseId: item.careCase.id },
                    })
                  }
                />
              ))}
            </ListSection>
          )}
        </ScrollView>
      </TabScreen>
    );
  }

  return (
    <TabScreen>
      <KeyboardAvoidingView className="flex-1" behavior="padding">
        <View className="flex-row items-center gap-1 border-b border-border/70 px-2 pb-2.5 pt-1">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Back to conversations"
            hitSlop={8}
            className="size-10 items-center justify-center rounded-full active:bg-secondary/60"
            onPress={() =>
              router.canGoBack() ? router.back() : router.replace("/messages")
            }
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
            Messages are stored with your case file. For emergencies call your
            local emergency number.
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
                  {mine ? "You" : "Care team"} ·{" "}
                  {formatDateTime(message.createdAt)}
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
            onChangeText={setDraft}
            multiline
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Send message"
            className="size-10 items-center justify-center rounded-full bg-primary active:opacity-80 disabled:opacity-40"
            disabled={sending || draft.trim() === ""}
            onPress={() => {
              void send();
            }}
          >
            <Icon as={Send} className="size-[18px] text-primary-foreground" />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </TabScreen>
  );
};

export default Messages;
