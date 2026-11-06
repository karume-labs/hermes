import {
  findCase,
  logAudit,
} from "@api/features/care-loop/services/case-repository";
import { queueNotification } from "@api/features/notify/services/notification-service";
import { createMessage } from "@api/features/patient/services/patient-repository";
import { NotFoundError } from "@api/features/shared/errors/index";
import type { CaseMessage, MessageSender } from "@hermes/types";

export interface SendMessageInput {
  caseId: string;
  sender: MessageSender;
  senderId: string;
  body: string;
}

// One write path for both sides of the thread: persist, notify the other
// party, and append the message to the cross-provider audit trail.
export const sendCaseMessage = async (
  input: SendMessageInput,
): Promise<CaseMessage> => {
  const careCase = await findCase(input.caseId);
  if (careCase === null) throw new NotFoundError("Case not found");

  const message = await createMessage(input);
  await queueNotification({
    caseId: careCase.id,
    patientId: careCase.patientId,
    channel: input.sender === "patient" ? "in_app" : "push",
    kind: "secure_message",
    payload: {
      messageId: message.id,
      sender: input.sender,
      preview: input.body.slice(0, 140),
    },
  });
  await logAudit(
    careCase.id,
    `${input.sender}:${input.senderId}`,
    "message_sent",
    {
      messageId: message.id,
    },
  );
  return message;
};
