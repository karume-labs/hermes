import type { CaseMessage, PatientCase } from "@hermes/types";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as React from "react";
import { TabScreen } from "@/components/layout/tab-screen";
import { ConversationList } from "@/components/messages/conversation-list";
import { MessageThread } from "@/components/messages/message-thread";
import { careApi } from "@/lib/care-api";
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
        <ConversationList
          cases={cases}
          loading={loading}
          error={error}
          onOpen={(id) =>
            router.push({ pathname: "/messages", params: { caseId: id } })
          }
        />
      </TabScreen>
    );
  }

  return (
    <TabScreen>
      <MessageThread
        messages={messages}
        draft={draft}
        error={error}
        loading={loading}
        sending={sending}
        onChangeDraft={setDraft}
        onSend={() => {
          void send();
        }}
        onBack={() =>
          router.canGoBack() ? router.back() : router.replace("/messages")
        }
      />
    </TabScreen>
  );
};

export default Messages;
