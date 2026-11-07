import { pct } from "@api/features/metrics/services/metrics-inputs";
import type { MobileEvent, NotificationRow } from "@api/features/metrics/types";

export const deliveryMetrics = (notifications: NotificationRow[]) => ({
  queued: notifications.filter((row) => row.status === "queued").length,
  sent: notifications.filter((row) => row.status === "sent").length,
  failed: notifications.filter((row) => row.status === "failed").length,
  read: notifications.filter((row) => row.status === "read").length,
  smsQueued: notifications.filter(
    (row) => row.kind === "sms_fallback" && row.status !== "failed",
  ).length,
});

export const engagementMetrics = (
  notifications: NotificationRow[],
  events: MobileEvent[],
  since: Date,
) => {
  const pushRows = notifications.filter((row) => row.channel === "push");
  const pushRead = pushRows.filter((row) => row.readAt !== null).length;
  const pushSettled = pushRows.filter(
    (row) => row.readAt !== null || row.status === "sent",
  ).length;
  const opened = events.filter((event) => event.type === "app_open");
  const recentPatients = new Set(
    opened
      .filter((event) => event.createdAt >= since)
      .map((event) => event.patientId),
  );
  const priorPatients = new Set(
    opened
      .filter((event) => event.createdAt < since)
      .map((event) => event.patientId),
  );
  const retained = [...priorPatients].filter((id) => recentPatients.has(id));

  return {
    pushReadPct: pct(pushRead, pushSettled),
    activePatients7d: recentPatients.size,
    appOpens7d: opened.filter((event) => event.createdAt >= since).length,
    retention7dPct: pct(retained.length, priorPatients.size),
  };
};
