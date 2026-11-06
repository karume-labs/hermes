import { env } from "@api/features/shared/env/index";
import { careCases } from "@db/care-loop/schema/index";
import { db } from "@db/client";
import { patients } from "@db/directory/schema/index";
import { notifications, webhookLogs } from "@db/notify/schema/index";
import { deviceTokens } from "@db/patient/schema/index";
import type {
  NotificationChannel,
  NotificationKind,
  NotificationStatus,
} from "@hermes/types";
import { and, desc, eq, inArray, lte, or } from "drizzle-orm";

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
  clinicId: string | null = null,
): Promise<QueuedNotification[]> => {
  const rows = await db
    .select({ notification: notifications })
    .from(notifications)
    .innerJoin(careCases, eq(notifications.caseId, careCases.id))
    .where(clinicId === null ? undefined : eq(careCases.clinicId, clinicId))
    .orderBy(desc(notifications.createdAt))
    .limit(limit);
  return rows.map((row) => toNotification(row.notification));
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

// A missing consent or device cannot be fixed by retrying.
class PermanentDeliveryError extends Error {}

interface PatientContact {
  phone: string;
  pushConsent: boolean;
  smsConsent: boolean;
}

const contactsFor = async (
  patientIds: string[],
): Promise<Map<string, PatientContact>> => {
  if (patientIds.length === 0) return new Map();
  const rows = await db
    .select({
      id: patients.id,
      phone: patients.phone,
      pushConsent: patients.pushConsent,
      smsConsent: patients.smsConsent,
    })
    .from(patients)
    .where(inArray(patients.id, patientIds));
  return new Map(
    rows.map((row) => [
      row.id,
      {
        phone: row.phone,
        pushConsent: row.pushConsent,
        smsConsent: row.smsConsent,
      },
    ]),
  );
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const notificationText = (row: NotificationRow): string => {
  if (isRecord(row.payload)) {
    if (typeof row.payload.text === "string") return row.payload.text;
    if (typeof row.payload.summary === "string") return row.payload.summary;
  }
  switch (row.kind) {
    case "visit_reminder":
      return "Your visit is tomorrow. Bring prior labs and arrive 15 minutes early.";
    case "escalation":
      return "Your result still needs follow-up. Open Hermes Care or call your clinic.";
    case "secure_message":
      return "Your care team sent you a secure message.";
    default:
      return "A new result is ready in Hermes Care.";
  }
};

const deleteInvalidTokens = async (tokens: string[]): Promise<void> => {
  if (tokens.length === 0) return;
  await db.delete(deviceTokens).where(inArray(deviceTokens.token, tokens));
};

const sendExpoPush = async (
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

const postSink = async (
  notification: NotificationRow,
  tokens: string[],
  contact: PatientContact | undefined,
): Promise<void> => {
  if (env.NOTIFY_WEBHOOK_URL === "") {
    throw new PermanentDeliveryError(
      "No notification provider is configured for this channel.",
    );
  }
  const response = await fetch(env.NOTIFY_WEBHOOK_URL, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      caseId: notification.caseId,
      patientId: notification.patientId,
      to: contact?.phone ?? null,
      text: notificationText(notification),
      channel: notification.channel,
      kind: notification.kind,
      payload: notification.payload,
      deviceTokens: tokens,
    }),
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) throw new Error(`sink responded ${response.status}`);
};

const deliver = async (
  notification: NotificationRow,
  contact: PatientContact | undefined,
): Promise<void> => {
  if (notification.channel === "in_app") return;

  if (notification.channel === "push") {
    if (contact === undefined) {
      throw new PermanentDeliveryError("Patient is not in the directory.");
    }
    if (!contact.pushConsent) {
      throw new PermanentDeliveryError("Patient has not consented to push.");
    }
    const tokens = await pushTokensFor(notification.patientId);
    if (tokens.length > 0) {
      await sendExpoPush(notification, tokens);
      return;
    }
    await postSink(notification, tokens, contact);
    return;
  }

  if (notification.channel === "sms") {
    if (contact === undefined) {
      throw new PermanentDeliveryError("Patient is not in the directory.");
    }
    if (!contact.smsConsent) {
      throw new PermanentDeliveryError("Patient has not consented to SMS.");
    }
    await postSink(notification, [], contact);
    return;
  }

  // Email delivery is not configured yet: keep the row queued rather than
  // pretending it was sent.
  throw new Error("Email provider is not configured.");
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

export interface DeliveryStats {
  queued: number;
  sent: number;
  failed: number;
  read: number;
  smsQueued: number;
}

export const notificationStats = async (
  clinicId: string | null = null,
): Promise<DeliveryStats> => {
  const rows = await db
    .select({ notification: notifications })
    .from(notifications)
    .innerJoin(careCases, eq(notifications.caseId, careCases.id))
    .where(clinicId === null ? undefined : eq(careCases.clinicId, clinicId))
    .then((result) => result.map((row) => row.notification));
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
