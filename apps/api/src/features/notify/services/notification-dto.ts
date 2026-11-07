import type { notifications } from "@db/notify/schema/index";
import type {
  NotificationChannel,
  NotificationKind,
  NotificationStatus,
} from "@hermes/types";

export type NotificationRow = typeof notifications.$inferSelect;

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

export const toNotification = (row: NotificationRow): QueuedNotification => ({
  id: row.id,
  caseId: row.caseId,
  patientId: row.patientId,
  channel: row.channel,
  kind: row.kind,
  status: row.status,
  payload: row.payload,
  attempts: row.attempts,
  error: row.error,
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
