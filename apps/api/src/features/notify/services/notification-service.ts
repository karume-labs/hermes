import { env } from "@api/features/shared/env/index";
import { db } from "@db/client";
import { notifications, webhookLogs } from "@db/notify/schema/index";
import { deviceTokens } from "@db/patient/schema/index";
import type {
  NotificationChannel,
  NotificationKind,
  NotificationStatus,
} from "@hermes/types";
import { and, desc, eq, lte, or } from "drizzle-orm";

type NotificationRow = typeof notifications.$inferSelect;

const MAX_ATTEMPTS = 5;
// Retry waits grow so a flaky provider is not hammered, but a transient
// failure still gets retried inside the coordinator's escalation window.
const BACKOFF_MINUTES = [1, 5, 15, 60, 180];

export interface QueuedNotification {
  id: string;
  caseId: string;
  patientId: string;
  channel: NotificationChannel;
  kind: NotificationKind;
  status: NotificationStatus;
  payload: unknown;
  attempts: number;
  error: string | null;
  sentAt: string | null;
  readAt: string | null;
  nextAttemptAt: string | null;
  createdAt: string;
}

const toNotification = (row: NotificationRow): QueuedNotification => ({
  id: row.id,
  caseId: row.caseId,
  patientId: row.patientId,
  channel: row.channel,
  kind: row.kind,
  status: row.status,
  payload: row.payload,
  attempts: row.attempts,
  error: row.error ?? null,
  sentAt: row.sentAt ? row.sentAt.toISOString() : null,
  readAt: row.readAt ? row.readAt.toISOString() : null,
  nextAttemptAt: row.nextAttemptAt ? row.nextAttemptAt.toISOString() : null,
  createdAt: row.createdAt.toISOString(),
});

export interface QueueNotificationInput {
  caseId: string;
  patientId: string;
  channel: NotificationChannel;
  kind: NotificationKind;
  payload: unknown;
}

export const queueNotification = async (
  input: QueueNotificationInput,
): Promise<void> => {
  await db.insert(notifications).values({ ...input, status: "queued" });
};

export const listNotifications = async (
  caseId: string,
): Promise<QueuedNotification[]> => {
  const rows = await db
    .select()
    .from(notifications)
    .where(eq(notifications.caseId, caseId))
    .orderBy(desc(notifications.createdAt));
  return rows.map(toNotification);
};

export const listPatientNotifications = async (
  patientId: string,
): Promise<QueuedNotification[]> => {
  const rows = await db
    .select()
    .from(notifications)
    .where(eq(notifications.patientId, patientId))
    .orderBy(desc(notifications.createdAt))
    .limit(50);
  return rows.map(toNotification);
};

export const listRecentNotifications = async (
  limit = 50,
): Promise<QueuedNotification[]> => {
  const rows = await db
    .select()
    .from(notifications)
    .orderBy(desc(notifications.createdAt))
    .limit(limit);
  return rows.map(toNotification);
};

export const markNotificationRead = async (id: string): Promise<boolean> => {
  const [row] = await db
    .update(notifications)
    .set({ status: "read", readAt: new Date() })
    .where(eq(notifications.id, id))
    .returning();
  return row !== undefined;
};

// Ownership is checked in the WHERE clause so a guessed id cannot mark a
// different patient's alert as read.
export const markNotificationReadForPatient = async (
  id: string,
  patientId: string,
): Promise<boolean> => {
  const [row] = await db
    .update(notifications)
    .set({ status: "read", readAt: new Date() })
    .where(
      and(eq(notifications.id, id), eq(notifications.patientId, patientId)),
    )
    .returning();
  return row !== undefined;
};

// Acknowledging a case is a read receipt for every alert it produced.
export const markCaseNotificationsRead = async (
  caseId: string,
): Promise<void> => {
  await db
    .update(notifications)
    .set({ status: "read", readAt: new Date() })
    .where(
      and(
        eq(notifications.caseId, caseId),
        or(
          eq(notifications.status, "sent"),
          eq(notifications.status, "delivered"),
          eq(notifications.status, "queued"),
        ),
      ),
    );
};

export const recordWebhook = async (
  source: string,
  ok: boolean,
  status: string,
  detail: unknown,
): Promise<void> => {
  await db.insert(webhookLogs).values({ source, ok, status, detail });
};

export const listWebhookLogs = async (limit = 50) => {
  const rows = await db
    .select()
    .from(webhookLogs)
    .orderBy(desc(webhookLogs.createdAt))
    .limit(limit);
  return rows.map((row) => ({
    id: row.id,
    source: row.source,
    ok: row.ok,
    status: row.status,
    detail: row.detail,
    createdAt: row.createdAt.toISOString(),
  }));
};

const pushTokensFor = async (patientId: string): Promise<string[]> => {
  const rows = await db
    .select({ token: deviceTokens.token })
    .from(deviceTokens)
    .where(eq(deviceTokens.patientId, patientId));
  return rows.map((row) => row.token);
};

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

const deliver = async (notification: NotificationRow): Promise<void> => {
  const deviceTokensValue = await pushTokensFor(notification.patientId);
  const response = await fetch(env.NOTIFY_WEBHOOK_URL, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      caseId: notification.caseId,
      patientId: notification.patientId,
      channel: notification.channel,
      kind: notification.kind,
      payload: notification.payload,
      deviceTokens: deviceTokensValue,
    }),
  });
  if (!response.ok) throw new Error(`sink responded ${response.status}`);
};

// Drains the outbox with bounded exponential backoff and SMS fallback.
// Without NOTIFY_WEBHOOK_URL rows stay queued — an honest signal that no
// provider is configured, rather than a fake `sent`.
export const dispatchPending = async (limit = 25): Promise<number> => {
  if (env.NOTIFY_WEBHOOK_URL === "") return 0;
  const now = new Date();
  const pending = await db
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
    .limit(limit);

  let delivered = 0;
  for (const notification of pending) {
    const attempts = notification.attempts + 1;
    try {
      await deliver(notification);
      await db
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
      const exhausted = attempts >= MAX_ATTEMPTS;
      const waitMinutes =
        BACKOFF_MINUTES[Math.min(attempts - 1, BACKOFF_MINUTES.length - 1)];
      await db
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
};

export interface DeliveryStats {
  queued: number;
  sent: number;
  failed: number;
  read: number;
  smsQueued: number;
}

export const notificationStats = async (): Promise<DeliveryStats> => {
  const rows = await db.select().from(notifications);
  return {
    queued: rows.filter((row) => row.status === "queued").length,
    sent: rows.filter((row) => row.status === "sent").length,
    failed: rows.filter((row) => row.status === "failed").length,
    read: rows.filter((row) => row.status === "read").length,
    smsQueued: rows.filter(
      (row) => row.kind === "sms_fallback" && row.status !== "failed",
    ).length,
  };
};

export const notificationRows = async () => db.select().from(notifications);
