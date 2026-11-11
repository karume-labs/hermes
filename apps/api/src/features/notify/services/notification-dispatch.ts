import {
  deliver,
  PermanentDeliveryError,
} from "@api/features/notify/services/notification-channels";
import type { NotificationRow } from "@api/features/notify/services/notification-dto";
import { contactsFor } from "@api/features/notify/services/notification-recipients";
import { queueNotification } from "@api/features/notify/services/notification-service";
import { recordWebhook } from "@api/features/notify/services/notification-webhooks";
import { db } from "@db/client";
import { notifications } from "@db/notify/schema/index";
import { and, eq, lte, or } from "drizzle-orm";

const MAX_ATTEMPTS = 5;
// Retry waits grow so a flaky provider is not hammered, but a transient
// failure still gets retried inside the coordinator's escalation window.
const BACKOFF_MINUTES = [1, 5, 15, 60, 180];

const smsFallbackFor = async (notification: NotificationRow): Promise<void> => {
  if (notification.channel !== "push") return;
  const prior = await db
    .select({ id: notifications.id })
    .from(notifications)
    .where(
      and(
        eq(notifications.caseId, notification.caseId),
        eq(notifications.kind, "sms_fallback"),
      ),
    )
    .limit(1);
  if (prior.length > 0) return;
  await queueNotification({
    caseId: notification.caseId,
    patientId: notification.patientId,
    channel: "sms",
    kind: "sms_fallback",
    payload: {
      text: "Your screening needs follow-up. Open Hermes Care or call your clinic.",
      fallbackFor: notification.id,
    },
  });
};

// Drains the outbox with bounded exponential backoff and SMS fallback. Rows
// are claimed with `FOR UPDATE SKIP LOCKED`, so two API replicas cannot send
// the same notification. In-app notices need no provider and settle at once.
export const dispatchPending = async (limit = 25): Promise<number> => {
  const now = new Date();
  return db.transaction(async (tx) => {
    const pending = await tx
      .select()
      .from(notifications)
      .where(
        or(
          eq(notifications.status, "queued"),
          and(
            eq(notifications.status, "failed"),
            lte(notifications.nextAttemptAt, now),
          ),
        ),
      )
      .orderBy(notifications.createdAt)
      .limit(limit)
      .for("update", { skipLocked: true });

    const contacts = await contactsFor([
      ...new Set(pending.map((row) => row.patientId)),
    ]);
    let delivered = 0;

    for (const notification of pending) {
      const attempts = notification.attempts + 1;
      try {
        await deliver(notification, contacts.get(notification.patientId));
        await tx
          .update(notifications)
          .set({
            status: "sent",
            attempts,
            sentAt: new Date(),
            error: null,
            nextAttemptAt: null,
          })
          .where(eq(notifications.id, notification.id));
        delivered += 1;
        if (notification.kind !== "sms_fallback") {
          await recordWebhook("notification", true, "sent", {
            notificationId: notification.id,
            channel: notification.channel,
          });
        }
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "delivery failed";
        const permanent = error instanceof PermanentDeliveryError;
        const exhausted = permanent || attempts >= MAX_ATTEMPTS;
        const waitMinutes =
          BACKOFF_MINUTES[Math.min(attempts - 1, BACKOFF_MINUTES.length - 1)];
        await tx
          .update(notifications)
          .set({
            status: "failed",
            attempts,
            error: message,
            nextAttemptAt: exhausted
              ? null
              : new Date(now.getTime() + waitMinutes * 60_000),
          })
          .where(eq(notifications.id, notification.id));
        await recordWebhook("notification", false, "failed", {
          notificationId: notification.id,
          channel: notification.channel,
          error: message,
        });
        if (exhausted) await smsFallbackFor(notification);
      }
    }
    return delivered;
  });
};
