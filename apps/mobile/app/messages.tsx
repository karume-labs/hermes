import type { CaseMessage } from "@hermes/types";
import { useLocalSearchParams } from "expo-router";
import { Send } from "lucide-react-native";
import * as React from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TextInput,
  View,
} from "react-native";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { careApi } from "@/lib/care-api";
import { formatDateTime } from "@/lib/case-format";
import { paramString } from "@/lib/params";
import { getPatientId, trackEvent } from "@/lib/session";

const Messages = () => {
  const params = useLocalSearchParams<{ caseId?: string }>();
  const caseId = paramString(params.caseId);
  const [patientId, setPatientId] = React.useState<string | null>(null);
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
        setError("No case selected.");
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

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-background"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={90}
    >
      <ScrollView contentContainerClassName="gap-3 p-4">
        <Text className="text-sm text-muted-foreground">
          Messages are encrypted in transit and stored with your case file. For
          emergencies call your local emergency number.
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
  );
};

export default Messages;
