import type { CaseMessage, PatientCase } from "@hermes/types";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ChevronLeft, ChevronRight, Send } from "lucide-react-native";
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
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { careApi } from "@/lib/care-api";
import { formatDateTime, statusLabel } from "@/lib/case-format";
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
          contentContainerClassName="gap-3 p-4 pb-12"
        >
          <Text className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
            Secure messages
          </Text>
          <Text variant="h3">Your conversations</Text>
          <Text className="text-sm text-muted-foreground">
            Messages are grouped by screening result and shared with your care
            team.
          </Text>
          {loading ? <ActivityIndicator /> : null}
          {error === "" ? null : (
            <Text className="text-sm text-destructive">{error}</Text>
          )}
          {loading || error !== "" ? null : cases.length === 0 ? (
            <View className="items-center gap-2 rounded-xl border border-border p-6">
              <Text className="font-medium">No conversations yet</Text>
              <Text className="text-center text-sm text-muted-foreground">
                When your care team sends an update, the conversation appears
                here.
              </Text>
            </View>
          ) : (
            cases.map((item) => (
              <Pressable
                key={item.careCase.id}
                className="gap-2 rounded-xl border border-border bg-card p-4 active:bg-accent"
                onPress={() =>
                  router.push({
                    pathname: "/messages",
                    params: { caseId: item.careCase.id },
                  })
                }
              >
                <View className="flex-row items-center justify-between gap-2">
                  <Text className="text-xs text-muted-foreground">
                    {statusLabel(item.careCase)}
                  </Text>
                  {item.unreadMessages > 0 ? (
                    <Text className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold text-primary-foreground">
                      {item.unreadMessages} new
                    </Text>
                  ) : null}
                </View>
                <Text className="font-medium">
                  {item.careCase.summaryPlainLanguage}
                </Text>
                <View className="flex-row items-center justify-between gap-2">
                  <Text className="text-xs text-muted-foreground">
                    {formatDateTime(item.careCase.updatedAt)}
                  </Text>
                  <Icon
                    as={ChevronRight}
                    className="size-4 text-muted-foreground"
                  />
                </View>
              </Pressable>
            ))
          )}
        </ScrollView>
      </TabScreen>
    );
  }

  return (
    <TabScreen>
      <KeyboardAvoidingView className="flex-1" behavior="padding">
        <View className="flex-row items-center gap-2 border-b border-border px-3 py-2">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Back to conversations"
            hitSlop={8}
            onPress={() =>
              router.canGoBack() ? router.back() : router.replace("/messages")
            }
          >
            <Icon as={ChevronLeft} className="size-5 text-foreground" />
          </Pressable>
          <Text className="font-medium">Conversation</Text>
        </View>
        <ScrollView contentContainerClassName="gap-3 p-4">
          <Text className="text-sm text-muted-foreground">
            Messages are encrypted in transit and stored with your case file.
            For emergencies call your local emergency number.
          </Text>
          {loading ? <ActivityIndicator /> : null}
          {!loading && messages.length === 0 ? (
            <Text className="text-muted-foreground">
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
                    ? "max-w-[85%] gap-1 self-end rounded-2xl rounded-br-sm bg-primary p-3"
                    : "max-w-[85%] gap-1 self-start rounded-2xl rounded-bl-sm border border-border bg-card p-3"
                }
              >
                <Text
                  className={
                    mine ? "text-primary-foreground" : "text-card-foreground"
                  }
                >
                  {message.body}
                </Text>
                <Text
                  className={
                    mine
                      ? "text-[10px] text-primary-foreground/70"
                      : "text-[10px] text-muted-foreground"
                  }
                >
                  {mine ? "You" : "Care team"} ·{" "}
                  {formatDateTime(message.createdAt)}
                </Text>
              </View>
            );
          })}
          {error === "" ? null : (
            <Text className="text-sm text-destructive">{error}</Text>
          )}
        </ScrollView>
        <View className="flex-row items-end gap-2 border-t border-border p-3">
          <TextInput
            className="max-h-28 flex-1 rounded-xl border border-input bg-background px-3 py-2 text-foreground"
            placeholder="Write a message…"
            placeholderTextColor="#94a3b8"
            value={draft}
            onChangeText={setDraft}
            multiline
          />
          <Button
            size="icon"
            onPress={send}
            disabled={sending || draft.trim() === ""}
          >
            <Icon as={Send} className="text-primary-foreground" />
          </Button>
        </View>
      </KeyboardAvoidingView>
    </TabScreen>
  );
};

export default Messages;
