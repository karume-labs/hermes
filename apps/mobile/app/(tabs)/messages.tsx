import type { CaseMessage } from "@hermes/types";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as React from "react";
import { TabScreen } from "@/components/layout/tab-screen";
import { ConversationList } from "@/components/messages/conversation-list";
import { MessageThread } from "@/components/messages/message-thread";
import {
  useCaseMessages,
  useMarkCaseRead,
  usePatientCases,
  useSendMessage,
} from "@/lib/api/queries";
import { paramString } from "@/lib/params";

const Messages = () => {
  const params = useLocalSearchParams<{ caseId?: string }>();
  const caseId = paramString(params.caseId);
  const router = useRouter();
  const cases = usePatientCases();
  const messages = useCaseMessages(caseId);
  const send = useSendMessage(caseId);
  const markRead = useMarkCaseRead(caseId);
  const [draft, setDraft] = React.useState("");

  React.useEffect(() => {
    if (caseId !== undefined) markRead.mutate();
  }, [caseId, markRead.mutate]);

  const onSend = async (): Promise<void> => {
    const body = draft.trim();
    if (caseId === undefined || body === "") return;
    await send.mutateAsync(body);
    setDraft("");
  };

  if (caseId === undefined) {
    return (
      <TabScreen>
        <ConversationList
          cases={cases.data ?? []}
          loading={cases.isPending}
          error={cases.error === null ? "" : cases.error.message}
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
        messages={(messages.data ?? []) as CaseMessage[]}
        draft={draft}
        error={
          messages.error !== null
            ? messages.error.message
            : send.error !== null
              ? send.error.message
              : ""
        }
        loading={messages.isPending}
        sending={send.isPending}
        onChangeDraft={setDraft}
        onSend={() => {
          void onSend();
        }}
        onBack={() =>
          router.canGoBack() ? router.back() : router.replace("/messages")
        }
      />
    </TabScreen>
  );
};

export default Messages;
