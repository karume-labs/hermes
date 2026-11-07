import {
  isRecord,
  notificationText,
} from "@api/features/notify/services/notification-channels";
import type { NotificationRow } from "@api/features/notify/services/notification-dto";
import { db } from "@db/client";
import { deviceTokens } from "@db/patient/schema/index";
import { inArray } from "drizzle-orm";

const deleteInvalidTokens = async (tokens: string[]): Promise<void> => {
  if (tokens.length === 0) return;
  await db.delete(deviceTokens).where(inArray(deviceTokens.token, tokens));
};

export const sendExpoPush = async (
  notification: NotificationRow,
  tokens: string[],
): Promise<void> => {
  const response = await fetch("https://exp.host/--/api/v2/push/send", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(
      tokens.map((to) => ({
        to,
        title: "Hermes Care",
        body: notificationText(notification),
        sound: "default",
        data: { caseId: notification.caseId, kind: notification.kind },
      })),
    ),
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) throw new Error(`Expo push responded ${response.status}`);

  const body: unknown = await response.json().catch(() => null);
  if (!isRecord(body) || !Array.isArray(body.data)) return;
  const invalid: string[] = [];
  body.data.forEach((ticket, index) => {
    if (!isRecord(ticket) || ticket.status !== "error") return;
    const details = isRecord(ticket.details) ? ticket.details : null;
    if (details !== null && details.error === "DeviceNotRegistered") {
      const token = tokens[index];
      if (token !== undefined) invalid.push(token);
    }
  });
  await deleteInvalidTokens(invalid);
};
