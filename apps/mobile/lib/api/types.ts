import type {
  NotificationChannel,
  NotificationKind,
  NotificationStatus,
} from "@hermes/types";

/** One row of the patient's notification history, as the API returns it. */
export interface PatientNotification {
  id: string;
  caseId: string;
  patientId: string;
  channel: NotificationChannel;
  kind: NotificationKind;
  status: NotificationStatus;
  attempts: number;
  payload?: unknown;
  createdAt: string;
  sentAt: string | null;
  readAt: string | null;
}
